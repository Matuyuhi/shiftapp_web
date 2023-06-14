var emsg = []
var msg = ""
//shiftareaの初期値
let e = document.getElementById("shifttext");
let s =
    `2023/01/01,14:00,22:00
2023/01/02,15:00,22:00
2023/01/03,15:00,22:00 etc...`;
e.placeholder = s;



function inputCheck() {
    var inputValue = document.getElementById("shifttext").value;
    var text = String(inputValue).replace(/\r\n|\r/g, "\n");
    var lines = text.split('\n');
    msg = ""
    var iserror = false;
    for (var i = 0; i < lines.length; i++) {
        // 空行は無視する
        if (lines[i] == '') {
            continue;
        }
        let contents = lines[i].replace(/\s+/g, "").split(',')

        let splitdate = String(contents[0]).split(/\/|\-/)
        splitdate[1]=set2fig(splitdate[1])//ここで一桁の数字に対応
        splitdate[2]=set2fig(splitdate[2])// **
        let tempdate = splitdate.join("/")
        if (!contents[0] || !splitdate[0] || !splitdate[1] || !splitdate[2]) {//入力はあるが、splitできていない
            tempdate = "YYYY/MM/DD"
        }
        const date = tempdate
        if (!date || datecheck(date) == 0) {
            msg += i + 1 + ": <warning>日付:" + date + "</warning>"
            iserror = true
        } else {
            msg += i + 1 + ": 日付:" + date
        }

        if (!contents[1]) {
            contents[1] = "--:--"
        }
        let intime = contents[1]
        if (iscollecttime(intime) == 0) {
            intime = intime ? intime : "--:--"
            msg += " <warning>出社:" + intime + "</warning>"
            iserror = true
        } else {
            msg += " 出社:" + intime
        }
        if (!contents[2]) {
            contents[2] = "--:--"
        }
        let outtime = contents[2]
        if (iscollecttime(outtime) == 0) {
            outtime = outtime ? outtime : "--:--"
            msg += " <warning>退社:" + outtime + "</warning>"
            iserror = true
        } else {
            msg += " 退社:" + outtime
        }

        var comment
        //もし、3じゃなかったらコメントを取得
        if (contents.length != 3) {
            comment = String(contents[3])
        }
        else {
            comment = ""
        }
        //console.log(datecheck(date))
        //console.log(emsg)
        msg += " 備考:" + comment
        if (iscollecttime(intime) && iscollecttime(outtime) && timecheck(intime, outtime) == 0) {
            msg += "   <warning>時刻が正しくないです</warning>"
            iserror = true
        }
        msg += "<br>"

    }
    //console.log(msg)
    document.getElementById("check").innerHTML = msg
    if (!msg) {
        document.getElementById("addbutton").innerHTML = "シフトを入力してください";
    }
    else if (emsg.length == 0 && !iserror) {
        document.getElementById("addbutton").innerHTML = "<p>エラーなし!!<br><input type='submit' value='送信' onclick='submitclick()' /></p>";
    } else {
        document.getElementById("addbutton").innerHTML = " ";
        document.getElementById("check").innerHTML += "<br>エラー箇所が<warning>赤色</warning>で表示されています"
    }

}
inputCheck();
//setInterval('inputCheck()', 500);

function submitclick() {
    alert("追加できました.");
}
