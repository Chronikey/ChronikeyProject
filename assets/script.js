let Password1=document.getElementById('password');
let Password2=document.getElementById('pass2');
let form=document.getElementById('TheForm');
 
Password2.addEventListener('input',()=>{
    if(Password1.value.trim()===Password2.value.trim()){
        document.getElementById('warning').innerHTML='Password Match!';
        document.getElementById('warning').style.color='green';
    }else{
        document.getElementById('warning').innerHTML='Passwords do not match';
        document.getElementById('warning').style.color='red';
    }

    if(Password1.value==='' && !Password1.value){
        document.getElementById('warning').innerHTML='';
    }
});

form.addEventListener('submit',(event)=>{
    if(Password1.value.trim()!=Password2.value.trim()){
        event.preventDefault();
    }
});

function RemoveMore(){
  document.getElementById('more').style.display='none';
}
   
function ShowMore(){
  document.getElementById('more').style.display='block';
}


document.querySelectorAll(".Add").forEach(add=>{

  add.addEventListener('click',(e)=>{
    e.preventDefault()
    document.getElementById('more').style.display='none';
    document.getElementById('create').style.display='block';
  })
