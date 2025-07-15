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
})
