package main

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/gomail.v2"
)

type LogType string

var emailRegexp *regexp.Regexp

// add a new log type for neutral log messages and set info to success
const (
	LogTypeInfo    LogType = "info"
	LogTypeWarning LogType = "warning"
	LogTypeError   LogType = "error"
)

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp string  `json:"timestamp"`
	Message   string  `json:"message"`
	Type      LogType `json:"type"`
}

// App struct
type App struct {
	ctx           context.Context
	logs          []LogEntry
	logsMutex     sync.RWMutex
	subscriptions map[string]chan LogEntry
	subMutex      sync.RWMutex
}

type recipient struct {
	Surname    string `json:"surname"`
	OtherNames string `json:"otherNames"`
	Email      string `json:"email"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		logs:          make([]LogEntry, 0),
		subscriptions: make(map[string]chan LogEntry),
	}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after front-end resources have been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue, false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

func (a *App) SendMail(sender string, password string, subject string, messageBody string, csvData []recipient) error {
	if sender == "" || password == "" || subject == "" || messageBody == "" {
		a.AddLog("Invalid input: One of the required fields is empty", LogTypeError)
		return errors.New("error: check logs")
	}
	isBadCsv := false
	// send logs to frontend to indicate check as started
	a.AddLog("Checking if recipients are valid", LogTypeInfo)

	// check if any row has both first name and last name empty
	for idx, r := range csvData {
		if r.Surname == "" && r.OtherNames == "" {
			isBadCsv = true
			a.AddLog(fmt.Sprintf("Entry at index: %d is invalid: No names object %v", idx+1, r), LogTypeError)
		}
	}

	// check if all emails are valid
	for idx, r := range csvData {
		if !emailRegexp.MatchString(r.Email) {
			isBadCsv = true
			a.AddLog(fmt.Sprintf("Entry at index: %d is invalid: Email is invalid %v", idx+1, r), LogTypeError)
		}
	}
	if isBadCsv {
		return errors.New("recipient entries contain errors: see logs for more details")
	}
	a.AddLog("Check was successful", LogTypeInfo)

	d := gomail.NewDialer("smtp.gmail.com", 465, sender, password)

	// Loop through each recipient and send email
	for idx, r := range csvData {
		// Create a new message for each recipient
		m := gomail.NewMessage()
		m.SetHeader("From", sender)
		m.SetHeader("To", r.Email)

		// replace escape sequence (new line) to html tag and  add name to EmailBody object
		messageBody = strings.ReplaceAll(messageBody, "\n", "<br>")
		bodyContent := "Dear " + r.Surname + " " + r.OtherNames + ",<br><br>" + messageBody
		m.SetHeader("Subject", subject)
		// add signature to the end
		m.SetBody("text/html", bodyContent)

		// Send the email
		if err := d.DialAndSend(m); err != nil {
			if idx != 0 {
				a.AddLog(fmt.Sprintf("Email sent to %d recipient(s)", idx+1), LogTypeError)
			}
			a.AddLog(fmt.Sprintf("sending mail to %s failed at entry number: %d. The whole process has been terminated", r.Email, idx+1), LogTypeError)
			return errors.New("error: check logs")
		}

		a.AddLog(fmt.Sprintf("Email sent to %s successfully", r.Email), LogTypeInfo)
	}

	return nil
}

// GetLogs returns all stored logs
func (a *App) GetLogs() []LogEntry {
	a.logsMutex.RLock()
	defer a.logsMutex.RUnlock()
	return a.logs
}

// AddLog adds a new log entry and notifies all subscribers
func (a *App) AddLog(message string, logType LogType) {
	newLog := LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Message:   message,
		Type:      logType,
	}

	a.logsMutex.Lock()
	a.logs = append(a.logs, newLog)
	a.logsMutex.Unlock()

	// Notify all subscribers
	a.subMutex.RLock()
	for _, ch := range a.subscriptions {
		select {
		case ch <- newLog:
		default:
			// If channel is full, we skip this subscriber
		}
	}
	a.subMutex.RUnlock()

	// Emit an event to notify the frontend
	runtime.EventsEmit(a.ctx, "newLog", newLog)
}

func init() {
	emailRegexp = regexp.MustCompile(`^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$`)
}
