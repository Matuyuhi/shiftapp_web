function iscollecttime(checktime) {
    if (!checktime) { return 0 }
    const match_time = String(checktime).match(/[0-9]{2}:[0-9]{2}/)
    if (String(match_time) != checktime) { return 0 }
    const splittedtime = String(checktime).split(':')
    if (!splittedtime[0] || !splittedtime[1]) { return 0 }
    var flag = 0

    if (((0 <= Number(splittedtime[0])) && (Number(splittedtime[0]) < 24)) || (Number(splittedtime[0]) == 99)) {
        if (((0 <= Number(splittedtime[1])) && (Number(splittedtime[1]) < 60)) || (Number(splittedtime[1]) == 99)) {
            flag = 1
        }
    }
    return flag
}
function datecheck(_date) {
    if (!_date || (new Date(_date)) == "Invalid Date") {
        return 0
    }
    const tempdate = _date.match(/[0-9]{4}\/[0-9]{2}\/[0-9]{2}/)
    if (!tempdate || !tempdate[0]) {
        return 0
    }
    var y = _date.split(/\/|-/)[0];
    var m = _date.split(/\/|-/)[1] - 1;
    var d = _date.split(/\/|-/)[2];

    
    let thisdate = new Date(y, m, d);
    // console.log(_date);
    // console.log(thisdate)
    if (thisdate.getFullYear() != y || thisdate.getMonth() != m || thisdate.getDate() != d) {
        return 0
    }

    var checkdate = _date.split(/\/|-/)
    if (checkdate.length != 3) {
        return 0
    }
    var checkcount = Number(checkdate[0]) * 10000 + Number(checkdate[1]) * 100 + Number(checkdate[2])
    //月曜日
    let today = new Date()
    let date = today.getDate()
    let day_num = today.getDay()
    let this_monday = date - day_num + 1

    //月曜日のインスタンス作成
    let monday = new Date(today.getFullYear(), today.getMonth(), this_monday);
    var nowcount = monday.getFullYear() * 10000 + (monday.getMonth() + 1) * 100 + monday.getDate()
    // console.log("now=" + nowcount)
    // console.log("checktime=" + checkcount)
    // console.log(Number(checkcount) >= Number(nowcount))
    if (Number(checkcount) >= Number(nowcount)) {
        return 1 //true
    } else {
        return 0 //false
    }

}
//二つの時間を比較する関数
function timecheck(intime, outtime) {
    if (iscollecttime(intime) == 0 || iscollecttime(outtime) == 0) {
        return 0
    }
    if (intime == "99:99" || outtime == "99:99") {
        return 1
    }

    const splittedintime = String(intime).split(":")
    const splittedouttime = String(outtime).split(":")
    const intimesec = Number(splittedintime[0]) * 60 + Number(splittedintime[1])
    const outtimesec = Number(splittedouttime[0]) * 60 + Number(splittedouttime[1])

    istrue = 0
    if (intimesec < outtimesec) {
        istrue = 1
    }
    //console.log(istrue)

    return istrue;
}