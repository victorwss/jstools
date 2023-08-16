from flask import Flask, render_template, make_response

app = Flask(__name__)

@app.route("/test")
def teste():
    return render_template("test.html")

@app.route("/json-test")
def teste2():
    r = '[{"id": 1, "nome": "Teste 123", "descricao": "Blabla 1"}, {"id": 2, "nome": "Teste 456", "descricao": "Blabla 2"}, {"id": 3, "nome": "Teste 789", "descricao": "Blabla 3"}, {"id": 4, "nome": "Teste 000", "descricao": "Blabla 4"}]'
    rr = make_response(r)
    rr.headers["Access-Control-Allow-Origin"] = "*"
    rr.headers["Content-Type"] = "application/json"
    return rr

if __name__ == "__main__":
    app.run(port = 8888)