let TimeOutId;
let Index=0;
let People=[];
window.onload=()=>{
  document.getElementById("invited-count").innerHTML=Index;
}

document.getElementById("SearchBar").addEventListener("input", () => {
  clearTimeout(TimeOutId);
  let SentToken = document.getElementById("SearchBar").value.trim();
   
  if (SentToken == "") {
    console.log("Empty");
    document.getElementById("nothing").style.display="none"
    document.getElementById("SearchResults").style.display="none";
    return;
  }
   
  TimeOutId = setTimeout(() => {
    fetch("https://chronikey.com/search", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ Token: SentToken }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.status) {
          document.getElementById("nothing").style.display="block"
          document.getElementById("SearchResults").style.display="none";
        
        } else {
          document.getElementById("SearchResults").innerHTML="";
          
          data.Results.forEach(e => {

            document.getElementById("SearchResults").style.display="block";
            document.getElementById("nothing").style.display="none";
           
            let InviteBtn=document.createElement("button");
            let Person=document.createElement("div");
            let NameHeading=document.createElement("h3");
            let image=document.createElement("img");
           
            NameHeading.textContent=e.TheName;
            InviteBtn.textContent="Invite";
            Person.className="person";
            InviteBtn.className="InviteBtn";

            InviteBtn.setAttribute("UserId",e.user_id);
            InviteBtn.setAttribute("UserName",e.TheName);
      
            Person.appendChild(image);
            Person.appendChild(NameHeading);
            Person.appendChild(InviteBtn);
            document.getElementById("SearchResults").appendChild(Person);  
            
            document.querySelectorAll(".InviteBtn").forEach(button=>{
              button.addEventListener("click",()=>{
                document.getElementById("emptyState").style.display="none";
                let User_id=button.getAttribute("UserId");
                let UserName=button.getAttribute("UserName");
                if(People.includes(User_id)) return;
                if(Index<=150){
                  Index+=1
                  document.getElementById("invited-count").innerHTML=Index;
                  People.push(User_id);
                  
                  let TheBtn=document .createElement("button");
                  TheBtn.textContent="✅ invited";
                  TheBtn.setAttribute("user_id",e.user_id);
                  console.log("We found the nigga's id:",e.user_id)
                  let image=document.createElement("img");
                  let TheUser=document.createElement("div");
                  let User_Name=document.createElement("h3");
                  User_Name.textContent=UserName;
                  TheUser.className="TheUser";
                  TheBtn.className="invited"
                  TheUser.id=e.user_id;
                
                  TheUser.appendChild(image);
                  TheUser.appendChild(User_Name);
                  TheUser.appendChild(TheBtn)
                  document.getElementById("userList").appendChild(TheUser);
                 console.log(People);

                  TheBtn.addEventListener("click",()=>{
                    Index-=1
                    document.getElementById("invited-count").innerHTML=Index;
                    People=People.filter(ID=>ID!==User_id);
                    document.getElementById(`${User_id}`).style.display='none';
                  })
        
                }
      })           
            })
  
          });
        }
      })
      .catch((err) => console.error(err));
  }, 1300);
});

function SubmitForm(e){
  let form =document.getElementById("event-form");
  let EventName=form.EventName.value;
  let WhoCanSee=form.repo.value;
  let Description=form.EventDescription.value;
  let start=form.start.value;
  let end=form.end.value;

  if(EventName=="" || !EventName || !WhoCanSee || WhoCanSee=="" || !Description || Description=="" || start=="" || !start || end=="" || !end){
    console.log("Are mad Nigga?");
    alert("Form is not fully filled, Nigga")
    return
  }

  // if(WhoCanSee !="Everyone" || WhoCanSee!="OnlyMe"){
  //   console.log("What's wrong with yah bruh?");
  //   console.log(WhoCanSee);
  //   return
  // }
  console.log("Ready to call api");
  fetch("http://chronikey.com/upload/to/event",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({EventName,end,start,Description,WhoCanSee,People})
  }).then(response=>response.json()).then(data=>{
    if(data.status){
      window.location.href=`https://chronikey.com/my/event/${data.PostID}`
    }else{
      document.getElementById(`${data.For}`).innerHTML=data.Reason;
      window.location.href=`#${data.For}`;
    }
  }).catch(err=>console.error(err))

}
