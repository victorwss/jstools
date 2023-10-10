"use strict";

function escapeHTML(txt) {
    return `${txt}`.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("'", "&apos;").replaceAll('"', "&quot;");
}

class ActionLinks {

    #onclick;
    #id;

    constructor(id, onclick) {
        this.#onclick = onclick;
        this.#id = id;
    }

    get onclick() {
        return this.#onclick;
    }

    get id() {
        return this.#id;
    }
}

class Action {

    #img;
    #linkFactory;

    constructor(img, linkFactory) {
        testType(img, STRING);
        testType(linkFactory, FUNCTION);
        this.#img = img;
        this.#linkFactory = linkFactory;
    }

    makeIcon(no, line) {
        testType(no, INT);
        testType(line, [ANY]);
        let links = this.#linkFactory(no, line);
        testType(links, ActionLinks);
        return `<button class="button" id="${links.id}" onclick="${links.onclick}"><img src="${this.#img}"></button>`;
    }
}

class DataTable {

    #descriptor;
    #data;
    #options;
    #id;

    constructor(id, descriptor, data, options) {
        testType(descriptor, [STRING]);
        testType(data, [[ANY]]);
        testType(options, [Action]);

        for (const line of data) {
            if (line.length !== descriptor.length) throw new ValueError("Inconsistent data size.");
        }

        this.#descriptor = descriptor;
        this.#data = data;
        this.#options = options;
        this.#id = id;
    }

    #makeHeader() {
        return "<tr>" + this.#descriptor.map(x => "<th>" + x + "</th>").join("") + this.#options.map(x => "<th></th>").join("") + "</tr>";
    }

    #makeLine(no, line) {
        console.log(no, line);
        return "<tr>"
                + line.map(x => "<td>" + escapeHTML(x) + "</td>").join("")
                + this.#options.map(x => "<td>" + x.makeIcon(no, line) + "</td>").join("")
                + "</tr>";
    }

    makeTable() {
        return `<table id="${this.#id}">` + this.#makeHeader() + this.#data.map((d, no) => this.#makeLine(no, d)).join("") + "</table>";
    }

    at(i) {
        testType(i, INT);
        return this.#data[i];
    }

    static async fetch(id, descriptor, url, options, transform) {
        testType(descriptor, [STRING]);
        testType(url, STRING);
        testType(options, [Action]);

        if (!transform) transform = XJSON.parser(false);
        testType(transform, FUNCTION);

        const response = await fetch(url);
        const data = response.text();
        const transformed = transform(data);
        return new DataTable(id, descriptor, transformed, options);
    }
}