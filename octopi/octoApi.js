const fetch = require('node-fetch');

class OctoPrinter {
    constructor(apiKey, baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey
        };
    }

    async getPrinterStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/api/printer`, {
                method: 'GET',
                headers: this.headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
        }
    }
    
    async homePrinter() {
        try {
            const response = await fetch(`${this.baseUrl}/api/printer/printhead`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    command: 'home',
                    axes: ['x', 'y', 'z']
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    async getPrinterJob() {
        try {
            const response = await fetch(`${this.baseUrl}/api/job`, {
                method: 'GET',
                headers: this.headers
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
        }
    }

    async cancelPrinterJob() {
        try {
            const response = await fetch(`${this.baseUrl}/api/job`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    command: 'cancel'
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.log(error);
        }
    }
}

module.exports = OctoPrinter;