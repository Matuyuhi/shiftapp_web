//日付取得関連

function set2fig(num) {
    // 桁数が1桁だったら先頭に0を加えて2桁に調整する
    var ret;
    if (Number(num) < 10) { ret = "0" + Number(num); }
    else { ret = num; }
    return ret;
}

function DateToString(_date) {
    if (_date.split(/\/|\-/)) { return _date; }

    y = today.getFullYear()
    m = today.getMonth() + 1
    d = today.getDate()
    return y + "-" + m + "-" + set2fig(d)
}

function getToday(){
    return moment().format("YYYY-MM-DD")
}
function getNextDate(_date) {
    let date = String(DateToString(_date))
    return moment(date).add(1, 'days').format("YYYY-MM-DD")
}
function getThisMonday() {
    return moment().day(1).format('YYYY-MM-DD')
}

function matchDate(_a,_b){
    let a = DateToString(_a).split(/\/|\-/)
    let b = DateToString(_b).split(/\/|\-/)
    if(!a[2] || !b[2]){return false}
    if(a[0]==b[0] && a[1]==b[1] && a[2]==b[2]){return true}
    return false
}