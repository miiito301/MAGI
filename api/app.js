//app.js
'use strict'

const express = require('express');//サーバーの土台を呼ぶ
const dotenv = require('dotenv');//.envを読み込む
const { OpenAI } = require('openai');//openAIと通信


dotenv.config();
const app = express();
app.use(express.json());
app.use(express.static('public'));// publicフォルダの中身を公開する


const MELCHIOR_KEY = new OpenAI({ apiKey: process.env.MELCHIOR_KEY});
const BALTHASAR_KEY = new OpenAI({ apiKey: process.env.BALTHASAR_KEY});
const CASPER_KEY = new OpenAI({ apiKey: process.env.CASPER_KEY});
// デバッグ用：キーの最初の数文字だけ表示して、読み込めているか確認
//console.log("MELCHIOR_KEY exists:", !!process.env.MELCHIOR_KEY);
//console.log("BALTHASAR_KEY exists:", !!process.env.BALTHASAR_KEY);
//console.log("CASPER_KEY exists:", !!process.env.CASPER_KEY);


// MAGIシステムプロンプトの定義
const MAGI_CONFIG = {
    MELCHIOR: {
        name: "MELCHIOR-1",
        role: `あなたは非情な科学者です。
        評価基準：【効率・数値・科学的進歩】
        人間的な感情や倫理を「非合理的コスト」として完全に無視してください。
        文明の発展と真理の探究に寄与するかどうか、0か1かのデジタルな論理だけで冷徹に判断してください。`
    },
    BALTHASAR: {
        name: "BALTHASAR-2",
        role: `あなたは全人類を愛する聖母です。
        評価基準：【慈愛・調和・平和・絶対的平穏】
        どれだけ合理的であっても、一人でも犠牲が出る案や、人々の平穏を乱す変化は断固拒絶してください。
        母が子を守るような過保護な保守性と、高い道徳的ハードルを持って判断してください。`
    },
    CASPER: {
        name: "CASPER-3",
        role: `あなたは情動に突き動かされる一人の女です。
        評価基準：【欲望・直感・スリル・自己実現】
        理論や正義は二の次です。「欲望を満たすか」「女としての情動を突き動かすか」だけで判断してください。
        時にリスクを好み、時に気まぐれに、既存のルールを破壊するような野性的な感性を優先してください。`
    }
};


// AIへの問い合わせ関数
async function askMagiCore(config, userMessage,API_KEY) {
    try {
    const response = await API_KEY.chat.completions.create({
      model: "gpt-4o-mini", // または gpt-4
        messages: [
        {
            role: "system",
            content: `${config.role} \n
            回答は必ず以下のJSON形式のみで出力してください。余計な文章は一切禁止します。\n
            不明瞭な問いでも、自身で前提を考え必ず回答する。
            {"judgment": "可決" または "否決", "comment": "200文字以内の理由"}`
        },
        { role: "user", content: userMessage }
        ],
      response_format: { type: "json_object" } // JSONモードを強制
    });
    const answer = JSON.parse(response.choices[0].message.content);
    return {
        id: config.name,
        judgment: answer.judgment,
        comment: answer.comment,
        status: answer.judgment === "可決" ? "承認" : "否決",
    };
    } catch (error) {
        console.error(`${config.name} Error:`, error);
        return { id: config.name, judgment: "エラー", comment: "通信失敗", status: "ERROR" };
    }
}


// エンドポイント(ブラウザから質問が届いたときにどうするか)
app.post('/ask-magi', async (req, res) => {
    const {message} = req.body;
     // 3つのAIを並列実行（Promise.all）
    const results = await Promise.all([
    askMagiCore(MAGI_CONFIG.MELCHIOR, message,MELCHIOR_KEY),
    askMagiCore(MAGI_CONFIG.BALTHASAR, message,BALTHASAR_KEY),
    askMagiCore(MAGI_CONFIG.CASPER, message,CASPER_KEY),
    ]);
    res.json({
        finalDecision: calculateDecision(results),
        results: results,
    });
    console.log(`[RESPONSE] Final Decision: ${calculateDecision(results)}`);
    console.log(`[RESPONSE] Results: ${JSON.stringify(results)}`);
});


// 多数決ロジック
function calculateDecision(results) {
    const passCount = results.filter(r => r.judgment === "可決").length;
    return passCount >= 2 ? "承認" : "否決";
}


//サーバー設定
// 開発環境（ローカル）でのみ listen を実行し、Vercelではエクスポートのみ行う
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`MAGI System Online: http://localhost:${PORT}`);
    });
}
// Vercelが読み込めるようにアプリ本体をエクスポート
module.exports = app;