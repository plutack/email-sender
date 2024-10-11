package main

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type LogType string

const (
	LogTypeInfo    LogType = "info"
	LogTypeWarning LogType = "warning"
	LogTypeError   LogType = "error"
)

// LogEntry represents a log entry
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Message   string `json:"message"`
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

func (a *App) SendMail(sender string, password string, recipients []string, messageBody string, csvData string) string {
    // Here you would implement your email sending logic
    // For this example, we'll just log the received data and return a status message

    log.Printf("Sending email from: %s", sender)
    log.Printf("To recipients: %v", recipients)
    log.Printf("Message body: %s", messageBody)
    log.Printf("CSV data: %s", csvData)

    // TODO: Implement actual email sending logic here

    return fmt.Sprintf("Email sent successfully from %s to %d recipients", sender, len(recipients))
}

// GetLogs returns all stored logs
func (a *App) GetLogs() []LogEntry {
	a.logsMutex.RLock()
	defer a.logsMutex.RUnlock()
	return a.logs
}

// SubscribeToLogs sets up a subscription for new logs
func (a *App) SubscribeToLogs(callback func(LogEntry)) {
	subID := time.Now().String() // Use a timestamp as a simple unique ID
	ch := make(chan LogEntry, 100)

	a.subMutex.Lock()
	a.subscriptions[subID] = ch
	a.subMutex.Unlock()

	// Start a goroutine to handle this subscription
	go func() {
		for log := range ch {
			callback(log)
		}
	}()

	// Start another goroutine to clean up the subscription when the frontend disconnects
	go func() {
		<-a.ctx.Done()
		a.subMutex.Lock()
		delete(a.subscriptions, subID)
		close(ch)
		a.subMutex.Unlock()
	}()
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