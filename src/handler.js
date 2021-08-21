class Handler {
    constructor(event, callback) {
        this.callback = callback;
        this.event = event;
    }

    async handle() {
        Promise.resolve("Great success!");
    }
}

exports.Handler = Handler;