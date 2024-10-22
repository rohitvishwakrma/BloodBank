
let slider=document.getElementsByClassName("slider")[0];
let count=0;
 window.addEventListener("load",move);
function move(){
    for(var i=slider.children.length-1;i>=0;i--){
        slider.children[i].style.left=`${100*i}`+"%";
    }
    getmove();   
}
function getmove(){
    let flag=true;
    let id=setInterval(function(){
        slider.style.transform=`translateX(-${100*count}%)`;
        if(count<slider.children.length-1&&flag==true){
            count++;
        }
        else{
            count--;
            flag=false
        }
        if(count==0)
            flag=true;
    },4000);
};

