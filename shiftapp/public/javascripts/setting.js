// console.log(document.getElementById("textarea-sort").value)

let data = document.getElementById("textarea-sort").value.split('\n')
console.log(data)


function copyTokenURL (_id) {
    const urlEle = document.getElementById("tokenUrl-url-"+String(_id))

    navigator.clipboard.writeText(urlEle.value)
    
}
