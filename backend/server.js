const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// =====================================================
// PASTAS
// =====================================================

const FRONTEND = path.join(__dirname, "../frontend");
const DB_FILE = path.join(__dirname, "db.json");

// =====================================================
// FRONTEND
// =====================================================

app.use(express.static(FRONTEND));

// =====================================================
// BANCO
// =====================================================

function readDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            return {
                usuarios: [],
                pacientes: [],
                triagens: [],
                consultas: [],
                tv_chamada: null,
                tv_historico: []
            };
        }

        const db = JSON.parse(
            fs.readFileSync(DB_FILE, "utf8")
        );

        if (!db.usuarios) db.usuarios = [];
        if (!db.pacientes) db.pacientes = [];
        if (!db.triagens) db.triagens = [];
        if (!db.consultas) db.consultas = [];
        if (!db.tv_chamada) db.tv_chamada = null;
        if (!db.tv_historico) db.tv_historico = [];

        return db;

    } catch (erro) {

        console.error("Erro ao ler banco:", erro);

        return {
            usuarios: [],
            pacientes: [],
            triagens: [],
            consultas: [],
            tv_chamada: null,
            tv_historico: []
        };
    }
}


function writeDB(data) {
    try {

        fs.writeFileSync(
            DB_FILE,
            JSON.stringify(data, null, 2),
            "utf8"
        );

        return true;

    } catch (erro) {

        console.error("Erro ao salvar banco:", erro);

        return false;
    }
}


// =====================================================
// LOGIN
// =====================================================

app.post("/login", (req, res) => {

    try {

        const usuario = String(
            req.body.usuario || ""
        ).trim();

        const senha = String(
            req.body.senha || ""
        );

        if (!usuario || !senha) {

            return res.status(400).json({
                sucesso: false,
                erro: "Digite usuário e senha."
            });
        }

        const db = readDB();

        const user = db.usuarios.find(u =>

            String(u.usuario).trim() === usuario &&
            String(u.senha) === senha

        );

        if (!user) {

            return res.status(401).json({
                sucesso: false,
                erro: "Usuário ou senha incorretos."
            });
        }


        let pagina = "";


        if (user.tipo === "triagem") {

            pagina = "/triagem.html";

        }

        else if (user.tipo === "medico") {

            pagina = "/medico.html";

        }

        else if (user.tipo === "atendimento") {

            pagina = "/atendimento.html";

        }

        else {

            return res.status(400).json({
                sucesso: false,
                erro: "Tipo de usuário não configurado."
            });
        }


        console.log(
            `Login: ${user.usuario} -> ${pagina}`
        );


        return res.json({

            sucesso: true,

            usuario: user.usuario,

            tipo: user.tipo,

            pagina: pagina

        });


    } catch (erro) {

        console.error("Erro no login:", erro);

        res.status(500).json({

            sucesso: false,

            erro: "Erro interno no servidor."

        });
    }
});


// =====================================================
// ATENDIMENTO
// =====================================================

app.post("/atendimento", (req, res) => {

    try {

        const db = readDB();

        const paciente = {

            id: Date.now(),

            nome: req.body.nome || "",

            cpf: req.body.cpf || "",

            tipo: req.body.tipo || "Particular",

            status: "triagem",

            createdAt: new Date().toISOString()

        };

        db.pacientes.push(paciente);

        if (!writeDB(db)) {

            return res.status(500).json({
                erro: "Erro ao salvar paciente."
            });
        }

        res.json(paciente);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao cadastrar paciente."
        });
    }
});


// =====================================================
// PACIENTES
// =====================================================

app.get("/pacientes", (req, res) => {

    const db = readDB();

    res.json(db.pacientes);

});


// =====================================================
// TRIAGEM
// =====================================================

app.post("/triagem", (req, res) => {

    try {

        const db = readDB();

        const temperatura =
            Number(req.body.temperatura);

        let risco = req.body.risco;


        if (temperatura >= 39) {

            risco = "vermelho";

        }

        else if (temperatura >= 38) {

            risco = "amarelo";

        }

        else if (!risco) {

            risco = "verde";

        }


        const triagem = {

            id: Date.now(),

            nome: req.body.nome || "",

            sintoma: req.body.sintoma || "",

            temperatura: temperatura || "",

            alergia: req.body.alergia || "",

            observacao: req.body.observacao || "",

            risco: risco,

            status: "aguardando_medico",

            createdAt: new Date().toISOString()

        };


        db.triagens.push(triagem);


        if (!writeDB(db)) {

            return res.status(500).json({
                erro: "Erro ao salvar triagem."
            });
        }


        res.json(triagem);


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao salvar triagem."
        });
    }
});


// =====================================================
// TRIAGENS
// =====================================================

app.get("/triagens", (req, res) => {

    const db = readDB();

    res.json(db.triagens);

});


// =====================================================
// TV - CHAMADA
// =====================================================

app.post("/tv/chamar", (req, res) => {

    try {

        const db = readDB();


        const chamada = {

            id: Date.now().toString(),

            localTipo: req.body.localTipo || "",

            localNumero: req.body.localNumero || "",

            paciente: req.body.paciente || "",

            hora: new Date().toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )

        };


        db.tv_chamada = chamada;

        db.tv_historico.unshift(chamada);


        if (db.tv_historico.length > 5) {

            db.tv_historico =
                db.tv_historico.slice(0, 5);

        }


        writeDB(db);

        res.json(chamada);


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao chamar paciente."
        });
    }
});


// =====================================================
// TV - CONSULTAR
// =====================================================

app.get("/tv/chamada", (req, res) => {

    const db = readDB();

    res.json({

        chamada: db.tv_chamada,

        historico: db.tv_historico

    });

});


// =====================================================
// LISTA DE MEDICAÇÕES
// =====================================================

app.get("/lista-medicacoes", (req, res) => {

    res.json([

        "Dipirona",
        "Paracetamol",
        "Ibuprofeno",
        "Amoxicilina",
        "Azitromicina",
        "Loratadina",
        "Omeprazol",
        "Buscopan",
        "Dramin",
        "Soro fisiológico"

    ]);

});


// =====================================================
// CONSULTA
// =====================================================

app.post("/consulta", (req, res) => {

    try {

        const db = readDB();


        const consulta = {

            id: Date.now(),

            paciente: req.body.paciente || "",

            diagnostico: req.body.diagnostico || "",

            medicacao: req.body.medicacao || "",

            obs: req.body.obs || "",

            createdAt: new Date().toISOString()

        };


        db.consultas.push(consulta);


        if (!writeDB(db)) {

            return res.status(500).json({
                erro: "Erro ao salvar consulta."
            });
        }


        res.json(consulta);


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao salvar consulta."
        });
    }
});


// =====================================================
// CONSULTAS
// =====================================================

app.get("/medicacoes", (req, res) => {

    const db = readDB();

    res.json(db.consultas);

});


// =====================================================
// ABRIR LOGIN
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(FRONTEND, "index.html")
    );

});


// =====================================================
// SERVIDOR
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `🏥 KS Hospital rodando na porta ${PORT}`
    );

});
