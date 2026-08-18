function login() {

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value;

    if (!usuario || !senha) {
        alert("Digite o usuário e a senha.");
        return;
    }

    const botao = document.querySelector("button");

    if (botao) {
        botao.disabled = true;
        botao.innerText = "Entrando...";
    }

    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario: usuario,
            senha: senha
        })
    })
    .then(async response => {

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || "Erro no login.");
        }

        return data;
    })
    .then(data => {

        console.log("Login realizado:", data);

        // GUARDA O USUÁRIO
        sessionStorage.setItem("usuario", data.usuario);
        sessionStorage.setItem("tipo", data.tipo);

        // TROCA DE PÁGINA
        if (data.tipo === "triagem") {

            window.location.replace("/triagem.html");

        } else if (data.tipo === "medico") {

            window.location.replace("/medico.html");

        } else if (data.tipo === "atendimento") {

            window.location.replace("/atendimento.html");

        } else {

            throw new Error("Tipo de usuário inválido: " + data.tipo);
        }

    })
    .catch(error => {

        console.error("Erro:", error);

        alert(error.message || "Não foi possível fazer login.");

        if (botao) {
            botao.disabled = false;
            botao.innerText = "Entrar";
        }
    });
}
