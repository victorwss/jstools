"use strict";

function escapeHTML(txt) {
    return `${txt}`.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("'", "&apos;").replaceAll('"', "&quot;");
}

class Acao {
    #img;
    #linkFactory;

    constructor(img, linkFactory) {
        testType(img, STRING);
        testType(img, FUNCTION);
        this.#img = img;
        this.#linkFactory = linkFactory;
    }

    makeIcon(line) {
        testType(data, [ANY]);
        return `<button class="button" onclick="${this.#linkFactory(line)}"><img src="${this.#img}"></button>`;
    }
}

class DataTable {

    #descriptor;
    #data;
    #options;

    constructor(descriptor, data, options) {
        testType(descriptor, [STRING]);
        testType(data, [[ANY]]);
        testType(options, [Acao]);
        for (const line of data) {
            if (line.length !== descriptor.length) throw new ValueError("Inconsistent data size.");
        }

        this.#descriptor = descriptor;
        this.#data = data;
        this.#options = options;
    }

    #makeHeader() {
        return "<tr>" + this.#descriptor.map(x => "<th>" + x + "</th>").join("") + this.#options.map(x => "<th></th>").join("") + "</tr>";
    }

    #makeLine(line) {
        return "<tr>" + line.map(x => "<td>" + escapeHTML(x) + "</td>").join("") + this.#options.map(x => "<td>" + x.makeIcon(line) + "</td>").join("") + "</tr>";
    }

    makeTable() {
        return "<table>" + this.#makeHeader() + this.#data.map(d => this.#makeLine(d)).join("") + "</table>";
    }

    static async fetch(descriptor, url, acao, transform) {
        testType(descriptor, [STRING]);
        testType(url, STRING);
        testType(options, [Acao]);
        if (!transform) transform = XJSON.parse;
        testType(transform, FUNCTION);

        const data = await fetch(url);
        return new DataTable(descriptor, transform(data), options);
    }
}