function getScrollPosById(elem_id) {
    let element = document.querySelector("#" + elem_id);
    if (!element) { return -1 }
    let rect = element.getBoundingClientRect();
    return rect.top;
}

window.addEventListener("load", function () {
    //windowのスクロール
	const positionY = localStorage.getItem("window-scrollY")
	if(positionY !== null){
		scrollTo(0, positionY)
	}
    window.addEventListener("scroll", function () {
        const positionY = window.pageYOffset
        localStorage.setItem("window-scrollY", positionY)
    })

    const myshift = document.querySelector(".scroll.myshift")
    const myshiftY = localStorage.getItem("myshift-scrollY")
    if (myshiftY !== null) {
        myshift.scrollTop = myshiftY
    }
    myshift.addEventListener("scroll", function () {
        const positionY = myshift.scrollTop;
        localStorage.setItem("myshift-scrollY", positionY);
    })

    //otherシフトのスクロール位置を今日にする
    const othershift = document.getElementById("othershift")
    const today = getScrollPosById("othershift-" + getToday()) - 2
    if (today != -1) {
        othershift.scrollTop = today - othershift.getBoundingClientRect().top
    }

    //今週の月曜日を入力の最小値
    document.getElementById("inputDate").setAttribute("min", getThisMonday())
});

function inputCheck() {
    msg = ""
    var iserror = false;

    let inputDate = document.getElementById("inputDate")
    const spliteddate = inputDate.value.split('-')
    const date = spliteddate.join("/")

    let inputIntime = document.getElementById("inputIntime")
    const intime = inputIntime.value

    let inputOuttime = document.getElementById("inputOuttime")
    const outtime = inputOuttime.value

    if (!date || !intime || !outtime) {
        if (document.getElementById("addbutton").innerHTML) {
            document.getElementById("addbutton").innerHTML = " ";
        }
        iserror = true
    }

    //判定
    if (datecheck(date) == 0) {
        //msg += "<warning>日付:" + date + "</warning>"
        iserror = true
        if (inputDate.classList.contains("is-valid")) {
            inputDate.classList.replace("is-valid", "is-invalid");
        }
    } else {
        //msg += "日付:" + date
        document.getElementById('inputDate-valid').innerHTML = date
        if (inputDate.classList.contains("is-invalid")) {
            inputDate.classList.replace("is-invalid", "is-valid");
        }
    }


    if (iscollecttime(intime) == 0 && intime) {
        //msg += " <warning>出社:" + intime + "</warning>"
        iserror = true
        if (inputIntime.classList.contains("is-valid")) {
            inputIntime.classList.replace("is-valid", "is-invalid");
        }
    } else {
        if (!intime) {
            //msg += " 出社:--:--"
            iserror = true
            if (inputIntime.classList.contains("is-valid")) {
                inputIntime.classList.replace("is-valid", "is-invalid");
            }
        }
        else {
            //msg += " 出社:" + intime
            document.getElementById('inputIntime-valid').innerHTML = intime + "<br><br>"
            if (inputIntime.classList.contains("is-invalid")) {
                inputIntime.classList.replace("is-invalid", "is-valid");
            }
        }

    }
    if (iscollecttime(outtime) == 0 && outtime) {
        //msg += " <warning>退社:" + outtime + "</warning>"
        iserror = true
        if (inputOuttime.classList.contains("is-valid")) {
            inputOuttime.classList.replace("is-valid", "is-invalid");
        }
    } else {
        if (!outtime) {
            //msg += " 退社:--:--"
            iserror = true
            if (inputOuttime.classList.contains("is-valid")) {
                inputOuttime.classList.replace("is-valid", "is-invalid");
            }
        }
        else {
            //msg += " 退社:" + outtime
            document.getElementById('inputOuttime-valid').innerHTML = outtime + "<br><br>"
            if (inputOuttime.classList.contains("is-invalid")) {
                inputOuttime.classList.replace("is-invalid", "is-valid");
            }
        }
    }

    if (iscollecttime(intime) && iscollecttime(outtime) && timecheck(intime, outtime) == 0) {
        msg += "<br><warning>時刻が正しくないです</warning>"
        iserror = true
        if (inputIntime.classList.contains("is-valid")) {
            inputIntime.classList.replace("is-valid", "is-invalid");
        }
        if (inputOuttime.classList.contains("is-valid")) {
            inputOuttime.classList.replace("is-valid", "is-invalid");
        }
    }
    //document.getElementById("check").innerHTML = ""
    document.getElementById("check").innerHTML = msg
    if (!msg) {
        document.getElementById("addbutton").innerHTML = "<br>";
    }
    if (!iserror) {
        document.getElementById("addbutton").innerHTML = "<input type='submit' value='送信' class='btnshine' />";
    } else {
        document.getElementById("addbutton").innerHTML = "<br>";
        document.getElementById("check").innerHTML += "エラー箇所が<warning>赤色</warning>で表示されています"
    }



}

inputCheck();

function deletecheck(_text) {
    if (window.confirm(_text + '\n削除してよろしいですか？')) { // 確認ダイアログを表示

        return true; // 「OK」時は送信を実行
    }
    else { // 「キャンセル」時の処理
        return false; // 送信を中止

    }
}
//setInterval('inputCheck()', 500);

//時計表示
function showClock() {
    var nowTime = new Date();
    const nowYear = nowTime.getFullYear();
    const nowMonth = nowTime.getMonth() + 1;
    const nowdate = nowTime.getDate();
    var nowHour = set2fig(nowTime.getHours());
    var nowMin = set2fig(nowTime.getMinutes());
    var nowSec = set2fig(nowTime.getSeconds());
    var msg = nowYear + "年 " + nowMonth + "月" + nowdate + "日 " + nowHour + ":" + nowMin + ":" + nowSec;
    document.getElementById("RealtimeClock").innerHTML = msg;
}
//setInterval('showClock()', 1000);
// 現在時刻の設定


const message = document.querySelector('.message');

//コピーボタンが押された時にここに飛んでくる、クラスを切り替えてる
document.querySelector('.popup').addEventListener('click', () => {
    message.classList.remove('hidden');
    message.classList.add('popup-message');
});

//アニメーションが完了した時の処理
message.addEventListener('animationend', () => {
    message.classList.remove('popup-message');
    message.classList.add('hidden');
});

function copyToClipboard(tagValue) {

    //httpsでのみclipboardが使えるd
    if (navigator.clipboard) { // navigator.clipboardが使えるか判定する
        return navigator.clipboard.writeText(tagValue).then(function () { // クリップボードへ書きむ
        })
    } else {
        //http(非推奨)
        // const dummyEl = document.createElement("input");
        // dummyEl.value = tagValue;
        // dummyEl.style.display = "none";
        // document.body.appendChild(dummyEl);
        // console.log(dummyEl);
        // console.log(dummyEl.value)
        // dummyEl.select() // inputタグを選択する
        // const result = document.execCommand('copy');
        // document.body.removeChild(dummyEl);
    }
}
function copybutton() {
    const tagValue = document.getElementById("copyTarget").innerText
    //console.log(tagValue)
    copyToClipboard(tagValue)
}
//viewを切り替える時に見ているuserを保持する
function viewmode_user(userid) {
    // console.log(userid);
    document.getElementById("view_user1").value = userid;
    document.getElementById("view_user2").value = userid;
    document.getElementById("view_user3").value = userid;
}
