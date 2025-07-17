window.onload=fetch('https://chronikey.com/my/event',{
     method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({PostID:window.location.pathname.split("/")[3]})
 }).then(response=>response.json()).then(data=>{
     let results=data.Results[0];
     if(results.Locked){
         document.getElementById("EventName").innerHTML=`✨${results.EventName}✨`;
         console.log("These are the results",results);
         setInterval(()=>{
             let StartDate=new Date(results.Start).getTime();
             let now=new Date().getTime();
             let DateDifference=StartDate-now;

             let Years=Math.floor(DateDifference/(1000*60*60*24*365));
             let Months=Math.floor((DateDifference%(1000*60*60*24*365))/(1000*60*60*24*30));
             let Days=Math.floor((DateDifference%(1000*60*60*24*30))/(1000*60*60*24));
             let Hours=Math.floor((DateDifference%(1000*60*60*24))/(1000*60*60));
             let Minutes=Math.floor((DateDifference%(1000*60*60))/(1000*60));
             let Seconds=Math.floor((DateDifference%(1000*60))/1000);
             
             let Text;
             if(Years==0 && Months==0 && Days==0 && Hours==0 && Minutes==0){
                 Text=`${Seconds} seconds Remaining`
             }
             else if(Years==0 && Months==0 && Days==0 && Hours==0){
                 Text=`${Minutes} Minutes ${Seconds} seconds Remaining`
             }
             else if(Years==0 && Months==0 && Days==0){
                 Text=`${Hours} Hours ${Minutes} Minutes ${Seconds} seconds Remaining`
             }
             else if(Years==0 && Months==0){
                 Text=`${Days} days ${Hours} Hours ${Minutes} Minutes Remaining`
             }
             else if(Years==0){
                 Text=`${Months} Months ${Days} days ${Hours} Hours Remaining`
             }else{
                 Text=`${Years} Years ${Months} Months ${Days} days Remaining`
                 
             }

             document.getElementById('CountDown').innerHTML=Text;
         },1000);
     }
 })