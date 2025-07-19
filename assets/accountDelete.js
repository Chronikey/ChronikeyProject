function deleteAcout(){
    fetch('/deleteAccount', {{
        method:"POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({VerificationCode:"2sj125hs8kisd8s"})
    }).then(response=>response.json()).then(data=>{
        if(!data.status){
            window.alert("Error:"+data.Reason);
            window.location.href="/";
        }
    }).catch(err=>{
        window.alert("Error:"+err);
        window.location.href="/";
    })
}