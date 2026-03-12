let history = [];
let counts = {};
let currentRotation = 0;

// 定数・DOM要素の取得
const speedInput = document.getElementById("speed");
const speedLabel = document.getElementById("speedLabel");
const resultDisplay = document.getElementById("result");
const wheelElement = document.getElementById("wheel");
const pointerElement = document.getElementById("pointer");
const modalElement = document.getElementById("modal");

/**
 * 速度ラベルの更新
 */
speedInput.oninput = () => {
    speedLabel.textContent = speedInput.value + " ms";
};

/**
 * タブ切り替え処理
 */
function switchTab(e, id) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");

    document.querySelectorAll(".tabContent").forEach(c => c.classList.remove("active"));
    document.getElementById(id).classList.add("active");
}

/**
 * 入力値からアイテム配列を取得
 */
function getItems() {
    const isNumTab = document.getElementById("num").classList.contains("active");

    if (isNumTab) {
        let min = document.getElementById("min").value || document.getElementById("min").placeholder;
        let max = document.getElementById("max").value || document.getElementById("max").placeholder;
        
        min = Number(min);
        max = Number(max);

        let arr = [];
        for (let i = min; i <= max; i++) arr.push(i);
        return arr;
    } else {
        const textValue = document.getElementById("textItems").value.trim();
        const placeholder = document.getElementById("textItems").placeholder;
        const source = textValue === "" ? placeholder : textValue;
        
        return source.split("\n").filter(x => x.trim() !== "");
    }
}

/**
 * 抽選の実行（メインロジック）
 */
function generate() {
    const items = getItems();
    const animType = document.getElementById("animation").value;
    const speedVal = Number(speedInput.value);

    // 円形ルーレットの場合
    if (animType === "spin") {
        pointerElement.style.display = "block";
        wheelElement.style.display = "block";
        buildWheel(items);
        spinWheel(items);
        return;
    } else {
        pointerElement.style.display = "none";
        wheelElement.style.display = "none";
    }

    // 通常アニメーション
    let counter = 0;
    const interval = setInterval(() => {
        resultDisplay.textContent = items[Math.floor(Math.random() * items.length)];
        counter++;

        if (counter > 15) {
            clearInterval(interval);
            const finalResult = items[Math.floor(Math.random() * items.length)];
            finish(finalResult);
        }
    }, speedVal);
}

/**
 * 円形ルーレットの生成
 */
function buildWheel(items) {
    wheelElement.innerHTML = "";
    const angle = 360 / items.length;

    items.forEach((item, i) => {
        const seg = document.createElement("div");
        seg.className = "segment";
        // 扇形を作るための変形
        seg.style.transform = `rotate(${i * angle}deg) skewY(${90 - angle}deg)`;
        seg.textContent = item;
        wheelElement.appendChild(seg);
    });
}

/**
 * 円形ルーレットの回転
 */
function spinWheel(items) {
    const angle = 360 / items.length;
    const index = Math.floor(Math.random() * items.length);
    const stopAngle = 360 - (index * angle + angle / 2);
    const extraSpins = 360 * 5; // 5回転分追加

    currentRotation += extraSpins + stopAngle;
    
    wheelElement.style.transition = "transform 4s cubic-bezier(.17,.67,.24,1)";
    wheelElement.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        finish(items[index]);
    }, 4000);
}

/**
 * 終了処理（履歴追加・チャート更新）
 */
function finish(value) {
    resultDisplay.textContent = value;
    history.unshift(value);
    counts[value] = (counts[value] || 0) + 1;

    updateHistoryList();
    drawChart();
}

/**
 * 履歴リストの更新
 */
function updateHistoryList() {
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    history.forEach(v => {
        const li = document.createElement("li");
        li.textContent = v;
        list.appendChild(li);
    });
}

/**
 * 分布チャートの描画
 */
function drawChart() {
    const canvas = document.getElementById("chart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const keys = Object.keys(counts);
    if (keys.length === 0) return;

    const maxCount = Math.max(...Object.values(counts));
    const barWidth = canvas.width / keys.length;

    keys.forEach((key, i) => {
        const barHeight = (counts[key] / maxCount) * (canvas.height - 30);
        
        ctx.fillStyle = "#4CAF50";
        ctx.fillRect(i * barWidth, canvas.height - barHeight - 20, barWidth - 4, barHeight);

        ctx.fillStyle = "white";
        ctx.font = "10px sans-serif";
        ctx.fillText(key, i * barWidth + 2, canvas.height - 5);
    });
}

/**
 * モーダル操作
 */
function openHistory() { modalElement.style.display = "block"; }
function closeHistory() { modalElement.style.display = "none"; }

function clearHistory() {
    if(!confirm("履歴を削除しますか？")) return;
    history = [];
    counts = {};
    updateHistoryList();
    drawChart();
}

/**
 * CSVダウンロード
 */
function downloadHistory() {
    if (history.length === 0) {
        alert("履歴がありません");
        return;
    }
    let csv = "result\n" + history.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "random_history.csv";
    a.click();
    URL.revokeObjectURL(url);
}