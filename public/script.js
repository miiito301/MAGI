'use strict'

async function askMagi() {
    const input = document.getElementById('user-input');
    const message = input.value;
    if (!message) return alert("MAGI receives no message");

    updateUIProcessing(message);

    try {
        const response = await fetch('/ask-magi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        updateUIResult(data);
    } catch (error) {
        console.error("MAGI Error:", error);
        document.getElementById('comment-bar').innerText = "SYSTEM ERROR";
    }
}

function updateUIProcessing(message) {
    // MAGIを緑色（分析中）に
    ['MELCHIOR', 'BALTHASAR', 'CASPER'].forEach(id => {
        const el = document.getElementById(id);
        el.className = 'panel bg-green';
        el.querySelector('.panel-result').innerText = 'ANALYZING...';
    });

    // メッセージを入力エリアに反映
    document.getElementById('display-code').innerText = message; 
    document.getElementById('display-message').innerText = "UNDER REVIEW";
    document.getElementById('final-decision-text').innerText = '審議中';
    document.getElementById('comment-bar').innerText = 'COMMUNICATING WITH MAGI...';
}

function updateUIResult(data) {
    const decisionEl = document.getElementById('final-decision-text');
    
    // 最終決議の表示 (PASSED/REJECTED)
    decisionEl.innerText = data.finalDecision;
    decisionEl.className = data.finalDecision === '承認' ? 'decision-box cyan-text' : 'decision-box orange-text';

    data.results.forEach(res => {
        const panelId = res.id.split('-')[0];
        const el = document.getElementById(panelId);
        if (el) {
            el.className = res.judgment === '可決' ? 'panel bg-cyan' : 'panel bg-red';
            el.querySelector('.panel-result').innerText = res.judgment;

            // マウスオーバー時にコメント表示
            el.onmouseenter = () => {
                document.getElementById('comment-bar').innerText = `[${res.id}]: ${res.comment}`;
            };
            el.onmouseleave = () => {
                document.getElementById('comment-bar').innerText = "DECISION COMPLETED.";
            };
        }
    });
    document.getElementById('display-message').innerText = "COMPLETED";
    document.getElementById('comment-bar').innerText = "DECISION COMPLETED.";
}