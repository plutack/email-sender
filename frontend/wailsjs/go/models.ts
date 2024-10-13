export namespace main {
	
	export class LogEntry {
	    timestamp: string;
	    message: string;
	    type: string;
	
	    static createFrom(source: any = {}) {
	        return new LogEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.message = source["message"];
	        this.type = source["type"];
	    }
	}
	export class recipient {
	    firstName: string;
	    lastName: string;
	    email: string;
	
	    static createFrom(source: any = {}) {
	        return new recipient(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.firstName = source["firstName"];
	        this.lastName = source["lastName"];
	        this.email = source["email"];
	    }
	}

}

