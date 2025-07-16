let AccessToken;
window.onload=()=>{
  let getCode="X9F4B7T2QJ";
  fetch(`https://chronikey.com/get/a/protection/token/:${getCode}`,{
    method:"GET",
    headers:{"content-Type":"application/json"}
  }).then(response=>response.json()).then(data=>{
    console.log("Token",data.Token)
    AccessToken=data.Token;
  })
}

let Feelings = [];

document.getElementById("feeling").addEventListener("change", () => {
  let CurrentFeeling = document.getElementById("feeling").value;

  if (Feelings.includes(CurrentFeeling) || !CurrentFeeling) return;

  Feelings.push(CurrentFeeling);
 
  let FeelingBtn = document.createElement("button");
  FeelingBtn.textContent = CurrentFeeling;
  document.getElementById("feelings").appendChild(FeelingBtn);
});

function fun(e) {
  e.preventDefault();
  const form = document.getElementById("mdnoForm");
  const Variable = new FormData(form);
  
  Variable.append("feelings", JSON.stringify(Feelings));
 
  if (
    !form.FileContent ||
    form.FileContent.files.length === 0 ||
    !form.MemoryName ||
    form.MemoryName.value.trim() === "" ||
    !form.openDateTime || // lowercase 'o', check your form element
    form.openDateTime.value.trim() === ""
  ) {
    alert("Form not fully filled");
    return;
  }
 
   console.log("Passed first stage and now will try to upload");
  fetch(`https://chronikey.com/upload/to/locked/${AccessToken}`, {
    method: "POST",
    body: Variable,
  })
    .then((response) => response.json())
    .then((data) => {
      if (!data.Status) {
        document.getElementById("error").innerHTML = data.Message;
        window.location.href="#error";
      } else {
        document.getElementById("error").innerHTML = "";
        window.location.href = "/list/locked";
      }
    })
    .catch((err) => {
      console.log(err);
    });
}
