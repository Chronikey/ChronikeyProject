require('dotenv').config();
const express = require('express');
const app = express();
const retry = require('async-retry');
const os=require('os')
const mysql = require('mysql2');
const path = require('path');
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy;
const flash=require('express-flash');
const session=require('express-session');
const nodemailer=require('nodemailer');
const uuid=require('uuid');
const dayjs=require('dayjs');
const moment=require('moment');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const JwtCode=process.env.JWT_SECRET
const multer=require("multer");
const sharp=require("sharp");
// Environment variables with fallbacks
const PORT = process.env.PORT || 3000;
const APP_NAME = process.env.APP_NAME || "MyApp";

//Middlewares

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.static(path.join(__dirname,'assets')));
app.set('view engine','ejs');
app.use(session({
    secret:process.env.SESSION_SECRET,
    saveUninitialized:true,
    resave:false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

let storage=multer.memoryStorage();


let con=mysql.createPool({
    user:process.env.MYSQL_USER,
    password:process.env.MYSQLPASSWORD,
    database:process.env.MYSQLDATABASE,
    host:'82.29.177.205' || '127.0.0.1',
    port:3306,
    waitForConnections: true,
    connectionLimit: 10,  // Number of simultaneous connections
    queueLimit: 0 
});

const EmailTranspoter=nodemailer.createTransport({
    host:'smtp.hostinger.com',
    secure:true,
    port:465,
    auth:{
        user:'services@chronikey.com',
        pass:process.env.EMAIL_PASSWORD
    }
});

passport.use(new LocalStrategy({usernameField:"Mail",passwordField:'password'},(username,password,done)=>{
   con.query('SELECT * FROM user_info2 where email=? AND VERIFIED=?',[username,true],(err,results)=>{
       if(err) throw err;
    
       if(results.length==0){
          return done(null,false,{message:`No user with email ${username} have been found in our databases`})
       }
   
       let user=results[0]
       console.log(`Results`,results);
       bcrypt.compare(password,user.password_hash,(err,Results)=>{
           if(err) throw err;

           if(!Results){
               return done(null,false,{message:'Incorrect Password'})
           }

           return done(null,user);
       })
   }) 
}))

passport.serializeUser((user,done)=>{
    done(null,user.email)
})

passport.deserializeUser((email,done)=>{
    con.query('select * from user_info2 where email=?',[email],(err,results)=>{
        if(err) throw err;

        if(results.length==0){
           return done(new Error("No user found"))
        }

        let user=results[0];

        return done(null,user)
    })
})

function NotAuthenticatedJson(req,res,next){
    if(!req.isAuthenticated()){
        return res.status(401).json({error:"Unauthorized. Please log in"})
    }
}

function NotAuthenticated(req,res,next){
    if(!req.isAuthenticated()){
        return res.redirect('/login');
    }

    return next()
}

function Authenticated(req,res,next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }

    return next()
}


app.get('/',NotAuthenticated,(req,res)=>{
    res.render('home')
});

app.get('/login',Authenticated,(req,res)=>{
    res.render('login',{loginError:req.flash('error')});
});

app.get('/register',Authenticated,(req,res)=>{
    res.render('register',{ErrorMessage:''});
});

app.get('/upload/to/locked',NotAuthenticated,(req,res)=>{
    res.render('uploadlocked');
});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
}))

app.post('/register',(req,res)=>{
    let email=req.body.Mail;
    let password=req.body.password;
    let fname=req.body.fname;
    let lname=req.body.lname;

    if(fname==='' || email==='' || !fname || !email || !password || !lname || lname===''||password===''){
        res.send('You see now the things you do!!!')
    }

    bcrypt.hash(req.body.password,10,(err,HashedPassword)=>{
        if(err) throw err;
        
        const Today=moment().format('YYYY-MM-DD HH:mm');
        const DateToday=moment().format('YYYY-MM-DD');
        const TimeNow=moment().format('HH:MM');
        con.query('INSERT INTO user_info2 VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',[uuid.v4(),req.body.fname,req.body.lname,req.body.Mail,HashedPassword,false,Today,"Create Account",Today,os.type(),req.ip,DateToday,TimeNow,os.type(),req.ip,null,null,null],err=>{
            if(err){
                if(err.code=='ER_DUP_ENTRY'){
                    return res.render('register',{ErrorMessage:'User with that email already exists in our databases.Try logging in.'})
                }else{
                    return res.render('register')
                }
            }

            let token=jwt.sign({Email:req.body.Mail},JwtCode,{expiresIn:'10m'});

            const MailOptions={
                from:'services@chronikey.com',
                to:req.body.Mail,
                subject:'Do not reply',
                html:`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Dancing+Script:wght@400..700&family=Edu+AU+VIC+WA+NT+Arrows:wght@400..700&family=Playwrite+HR+Lijeva+Guides&family=Playwrite+IN:wght@100..400&family=Playwrite+MX+Guides&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Yuji+Mai&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .outerDiv{
            border: 1px solid black;
            padding: 20px;
            border-radius: 10px;
            background-color: aliceblue;
        }.innerDiv{
            background-color: rgba(247, 247, 247, 0.683);
            border: 1px solid ;
            box-shadow: 3px 3px 3px 3px rgba(130, 108, 108, 0.057);
            padding: 8px;
            width: 500px;
            margin: 1px;
            border-radius:10px ;
        }.innerDiv img{
            width: 100px;
        }.innerDiv .logoPartEmail a{
            text-decoration: none;
            color: black;
            font-family: "Edu AU VIC WA NT Arrows", cursive;
            font-optical-sizing: auto;
            font-weight: bold;
            font-style: normal;
            font-size: 30px;
        }.logoPartEmail{
            text-align: center;
        }.Btn{
            text-decoration: none;
            display: block;
            margin:  10px;
            border: 1px solid white;
            color: white;
            background-color: greenyellow;
            width: 120px;
            padding: 5px;
            border-radius: 5px;
            font-weight: bold;
        }.Btn:hover{
            background-color: white;
            border: 1px solid greenyellow;
            color: greenyellow;
        }
    </style>
</head>
<body>
    <div class="innerDiv">
        <div class="logoPartEmail">
            <a href="https://chronikey.com/" target="_blank">ChroniKey.com</a>
        </div>
        <hr>
        This email is to confirm the account with email <a href="mailto:F@G" target="_blank">${req.body.Mail}</a>. Click the link below to verify your account.
        <br> <br>
        Please not that the token expires in 10 minutes(${moment().add(10,'m').format("HH:mm")}).
        <a style='text-align:center;' href="https://chronikey.com/verify?token=${token}" class="Btn">Verify Email</a>
    </div>
</body>
</html>`
            }

            EmailTranspoter.sendMail(MailOptions,err=>{
                if(err) throw err;
                console.log('email sent');

            })
            res.render('emailSent',{Email:req.body.Mail});
        })
    })
});
//Deleting old Users
(async function CheckDelete(){
    while(true){
        await retry(async ()=>{

            con.query('DELETE From user_info2 WHERE date_joined < NOW() - INTERVAL 11 minute AND VERIFIED=?',[false],(err)=>{
                if(err) throw err;

            })
        },{
            retries:1,
            maxTimeout:0,
            minTimeout:0
        });

        await new Promise(resolve=>{setTimeout(resolve,2000)})
    }
})();


//Password Change Mechanism Begin

app.get('/forgotPassword',(req,res)=>{
    res.render('passwordchange',{EmailError:''});
})


app.post('/forgotPassword',(req,res)=>{
   
    con.query('select * from user_info2 where email=? AND VERIFIED=?',[req.body.Mail,true],(err,results)=>{
        if(err) throw err;
        
        if(results.length==0){
            return res.render('passwordchange',{EmailError:"No user with tha email have been found"})
        }
        
        let user=results[0];

        let m1=moment(user.Last_Profile_Update,"YYYY-MM-DD HH:mm");
        let m2=moment();
        let timeDifference=m2.diff(m1,'hours');
        let nextAllowedTime = m1.add(24, 'hours').format("YYYY-MM-DD HH:mm");
        console.log(timeDifference,nextAllowedTime)
        if(timeDifference<24){
            return res.render('passwordchange',{EmailError:`You changed your profile in less than 24 hours ago. You can only change it again after ${nextAllowedTime}`});
         }


        const token=jwt.sign({Email:req.body.Mail},JwtCode,{expiresIn:'10m'});

        const MailOptions={
            from:'services@chronikey.com',
            to:req.body.Mail,
            subject:'Email change request',
            html:`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chronikey - Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #111;">

  <table align="center" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; border: 1px solid #ddd;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #eee;">
        <h1 style="margin: 0; font-size: 28px; letter-spacing: 1px;">Chronikey</h1>
        <p style="margin-top: 8px; font-size: 14px; color: #444;">Where your memories live forever.</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; line-height: 1.5;">Hello,</p>
        <p style="font-size: 16px; line-height: 1.6;">
          You requested to reset your Chronikey password. Click the button below to proceed. 
          This link will expire in <strong>10 minutes</strong>.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://chronikey.com/passwordChange?token=${token}"
             style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; font-size: 16px; border-radius: 5px;">
            Reset Password
          </a>
        </div>

        <p style="font-size: 14px; color: #555;">
          If you didn’t request this, please ignore this email. Your account is safe.
        </p>

        <p style="font-size: 14px; margin-top: 30px;">– The Chronikey Team</p>
      </td>
    </tr>

    <tr>
      <td style="padding: 20px 30px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #888;">
        &copy; 2025 Chronikey. All rights reserved.
      </td>
    </tr>
  </table>

</body>
</html>
`
        }

         EmailTranspoter.sendMail(MailOptions,err=>{
            if(err) throw err;
            console.log('Email sent')
        })

        res.send('email to reset password has been sent')
    })
})


app.get('/passwordChange',(req,res)=>{
    const token=req.query.token;

    jwt.verify(token,JwtCode,(err,decoded)=>{
        if(err){
            return res.render('403')
        }

        const email=decoded.Email;
        const expiryUnix=decoded.exp;

        const expireyTime=moment.unix(expiryUnix).add(2,'hours').format("HH:mm");
        req.session.mail=email;
        return res.render('passchange',{Email:email,expire:expireyTime})
    })
})

app.post('/passwordChange',(req,res)=>{
    const Email=req.session.mail;
    const password=req.body.password;
    const LastUpdate=moment().format('YYYY-MM-DD HH:mm');
    const OperatingSystem=os.type();

    bcrypt.hash(password,10,(err,hashed)=>{
      if(err) throw err

        con.query('UPDATE user_info2 set password_hash=?,Last_Profile_Update=?,TypeOfProfileUpdate=?,os_last=?,ip_last=? WHERE email=?',[hashed,LastUpdate,'PasswordChange',OperatingSystem,req.ip,Email],err=>{
            if(err) throw err;
            res.send('password changed! Login: <a href="/login">Login<a>');
        })
    })
})

//Password change end
app.get('/verify',(req,res)=>{
    const token=req.query.token;

    jwt.verify(token,JwtCode,(err,decoded)=>{
        if(err){
            return res.render('jwt');
        }

        const email=decoded.Email;

        con.query(`UPDATE user_info2 SET VERIFIED=? WHERE email=?`,[true,email],err=>{
            if(err) throw err;

            console.log('The email is the following',email)

            con.query('SELECT * FROM user_info2 WHERE email=?',[email],(err,results)=>{
                if(err) throw err;
   
                req.logIn(results[0],err=>{
                    if(err) throw err;
                    res.redirect('/')
                })
            })
        })
    })
});

app.get("/list/locked",NotAuthenticated,(req,res)=>{
    con.query("SELECT * FROM LockedMemories where user_id=?",[req.user.id],(err,results)=>{
        if(err) throw err;
       
        let NewResults=results.map(result=>{
            let now=dayjs();
            let OpenedOn=dayjs(result.date_to_be_opened);
            let RemainingTime=OpenedOn.diff(now,"minutes");
            let TimeRemaining;
            
            if(RemainingTime>525599){
                TimeRemaining=(RemainingTime/525599).toFixed(0)+" Years Remaining"
            }else if(RemainingTime>43800){
                TimeRemaining=(RemainingTime/43800).toFixed(0)+" Months remaining"
            }
           else if(RemainingTime>1440){
                TimeRemaining=(RemainingTime/1440).toFixed(0)+" Days Remaining"
            }else if(RemainingTime>60){
                TimeRemaining=`${(RemainingTime/60).toFixed(0)} Hours remaining`
            }else{
                TimeRemaining==RemainingTime+" Minutes Remaining";
            }

            if(RemainingTime>0){
                return{
                    Locked: true,
                    memoryName:result.MemoryName,
                    ToBeOpened:TimeRemaining
                }
            }else{
                return{
                    Locked:false,
                    PostID:result.post_id,
                    memoryName:result.MemoryName
                }
            }
        })
        res.render("LockedMemoryList",{TheResults:NewResults})
    })
})

let upload=multer({storage,fileFilter:(req,file,cb)=>{
    let Type=/jpeg|jpg|png/;
    let extname=Type.test(path.extname(file.originalname).toLowerCase());
    let mimeType=Type.test(file.mimetype);

    if(mimeType && extname){
        cb(null,true)
    }else{
        cb(new Error("Incorrect file type uploaded"))
    }
}})

let Dir=path.join(__dirname,"uploads");
app.post('/upload/to/locked/:accessToken',NotAuthenticatedJson,upload.array("FileContent",5),(req,res)=>{
    console.log("This is the access Token",req.params.accessToken)
    jwt.verify(req.params.accessToken,"2265",(err,decoded)=>{
        if(err){
            return res.send("error")
        };

        console.log("This is what the user is trying to upload",req.body);
        let OpenDate=dayjs(req.body.openDateTime);
        let now=dayjs();
        let timeDifference=OpenDate.diff(now,"days");
    
        if(timeDifference<30){
            return res.json({Status:false,Message:"Image should be locked for at least a month"})
        }
    
        let Images=[];
        console.log("Initiating image processing")
        for(const image of req.files){
            let fileName="OurImage"+uuid.v4()+".jpeg";
            let toFile=path.join(Dir,fileName);
    
            sharp(image.buffer)
            .jpeg({quality:75})
            .resize({width:400})
            .toFile(toFile)
    
            Images.push(fileName)
        }

        console.log("Image processing complete.");
        console.log("Initiating Mysql updated");
        con.query("INSERT INTO LockedMemories VALUES(?,?,?,?,?,?,?,?,?,?,?)",[req.user.id,uuid.v4(),req.body.MemoryName,JSON.stringify(Images),"null",req.body.message,req.body.feelings,req.body.openDateTime,dayjs().format("YYYY-MM-DD HH:mm"),os.type(),req.ip],err=>{
            if(err) throw err;
            return res.json({Status:true});
        })
    })
})

app.get('/create/event',NotAuthenticated,(req,res)=>{
    res.render("EventUpload")
})

app.get("/my/event/:eventid",(req,res)=>{
    con.query("SELECT * FROM eventowner where EventId=?",[req.params.eventid],(err,results)=>{
        if(err) throw err;
        let Outcome=results[0];
        let StartDate=dayjs(Outcome.StartDate);
        let now=dayjs();


        let Difference=StartDate.diff(now,"seconds");

        let query="SELECT * FROM user_info2 JOIN events ON employees.id=events.user_id WHERE events.EventId=?";
        if(Difference>0){
            con.query(query,[req.params.eventid],(err,Results)=>{
                if(err) throw err;
    
                let OutPut=Results.map(output=>({
                    Username:output.Fullnames,
                    Status:output.UserStatus
                }))

                console.log(OutPut);
                let Invited=OutPut.filter(object=>object.Status==="Invited").length;
                let Accepted=OutPut.filter(object=>object.Status==="Accepted").length;
                let Requested=OutPut.filter(object=>object.Status==="declined").length;
                let UserInvited=OutPut.filter(object=>object.Status==="Invited");
                let UserAccepted=OutPut.filter(object=>object.Status==="Accepted");
                let UserRequested=OutPut.filter(object=>object.Status==="declined");

                return res.render("myevent",{Out:OutPut,Invited,Requested,Accepted,UserInvited,UserAccepted,UserRequested});                
            })
        }else{
            return res.send("Hello world")
        }
        
    })
})

app.post("/upload/to/event",NotAuthenticated,(req,res)=>{
   let StartingDate=dayjs(req.body.start);
   let EndingDate=dayjs(req.body.end);
   let Now=dayjs();
   let PostID=uuid.v4();
   let Ids=req.body.People;
   let userId="1234";

   let EventDuration=EndingDate.diff(StartingDate,"days");

   if(StartingDate.diff(Now,"minutes")<5){
    return res.json({status:false,Reason:"Event should be starting in at least 5 minutes from now!",For:"dates"})
   }

   if(EventDuration<0){
    return res.json({status:false,Reason:"Starting Date cannot be after Ending date. It does not make sense😭",For:'dates'})
   }if(EventDuration>3){
    return res.json({status:false,Reason:"Events can be up to 3 days long",For:"dates"})
   }

   Ids.forEach(UserId => {
    con.query("select * from user_info2 where id=?",[req.user.id],(err,results)=>{
        if(err) throw err;

        if(results.length==0){
            return req.json({status:false,Reason:"One of the invited users are not in our databases",For:"Invited"});
        }
    })
   });
   
   con.query("INSERT INTO EventOwner VALUES(?,?,?,?,?,?,?,?,?,?)",[PostID,req.user.id,req.body.EventName,req.body.Description,req.body.WhoCanSee,dayjs().format("YYYY-MM-DD HH:mm"),req.body.start,req.body.end,os.type(),req.ip],err=>{
    if(err) throw err;
   })

   if(Ids.length==0){
    console.log("There were no Users Invited, So we stopped here")
    return res.json({status:true,PostID});
   }

   Ids.forEach(Person=>{
    con.query("INSERT INTO Events VALUES(?,?,?,?,?,?,?,?,?,?)",[PostID,Person,"Invited",req.body.EventName,"null",req.body.Description,req.body.WhoCanSee,dayjs().format("YYYY-MM-DD HH:mm"),req.body.start,req.body.end],err=>{
        if(err) throw err;

        con.query("SELECT email from user_info2 where id=?",[Person],(err,results)=>{
            if(err) throw err;
            
            let Token=jwt.sign({EventName:req.body.EventName,EventId:PostID,User:Person},JwtCode,{expiresIn:"48h"});

            let email=results.map(theEmail=>({Email:theEmail.email}));
            let UserEmail=email[0].Email;
            console.log("This is where we are going to send the email",UserEmail);

            const MailOptions={
                            from:"services@chronikey.com",
                            to:UserEmail,
                            subject: `You're Invited to ${req.body.EventName}!`,
                            html:` 
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Event Invitation</title>
                                </head>
                                <body style="
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 40px 20px;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    min-height: 100vh;
                                ">
                                    <div style="
                                        background: white;
                                        padding: 40px;
                                        border-radius: 20px;
                                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                                        text-align: center;
                                        position: relative;
                                        overflow: hidden;
                                    ">
                                        <!-- Decorative background elements -->
                                        <div style="
                                            position: absolute;
                                            top: -50px;
                                            right: -50px;
                                            width: 100px;
                                            height: 100px;
                                            background: linear-gradient(45deg, #ff6b6b, #feca57);
                                            border-radius: 50%;
                                            opacity: 0.1;
                                        "></div>
                                        <div style="
                                            position: absolute;
                                            bottom: -30px;
                                            left: -30px;
                                            width: 60px;
                                            height: 60px;
                                            background: linear-gradient(45deg, #48dbfb, #0abde3);
                                            border-radius: 50%;
                                            opacity: 0.1;
                                        "></div>
                                        
                                        <!-- Main content -->
                                        <div style="position: relative; z-index: 1;">
                                            <h2 style="
                                                font-size: 2.5rem;
                                                font-weight: 700;
                                                margin: 0 0 30px 0;
                                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                -webkit-background-clip: text;
                                                -webkit-text-fill-color: transparent;
                                                background-clip: text;
                                                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            ">Hello,${req.user.name}</h2>
                                            
                                            <div style="
                                                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                                                padding: 30px;
                                                border-radius: 15px;
                                                margin: 30px 0;
                                                box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);
                                            ">
                                                <p style="
                                                    font-size: 1.2rem;
                                                    color: white;
                                                    margin: 0;
                                                    font-weight: 500;
                                                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                                                ">You've been invited to <strong style="font-weight: 700; text-decoration: underline;">${req.body.EventName}</strong> by <em style="font-style: italic;">"Sizwe"</em>.</p>
                                            </div>
                                            
                                            <!-- Action buttons -->
                                            <div style="margin: 40px 0 30px 0;">
                                                <a href='https://chronikey.com/invite/response?token=${Token}&response=${false}' style="
                                                    display: inline-block;
                                                    background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                                                    color: white;
                                                    text-decoration: none;
                                                    padding: 15px 35px;
                                                    border-radius: 50px;
                                                    font-weight: 600;
                                                    font-size: 1.1rem;
                                                    margin: 0 10px;
                                                    transition: all 0.3s ease;
                                                    box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
                                                    border: none;
                                                    cursor: pointer;
                                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(255, 107, 107, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(255, 107, 107, 0.4)';">
                                                    ✗ Decline
                                                </a>
                                                
                                                <a href='https://chronikey.com/invite/response?token=${Token}&response=${true}' style="
                                                    display: inline-block;
                                                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                                                    color: white;
                                                    text-decoration: none;
                                                    padding: 15px 35px;
                                                    border-radius: 50px;
                                                    font-weight: 600;
                                                    font-size: 1.1rem;
                                                    margin: 0 10px;
                                                    transition: all 0.3s ease;
                                                    box-shadow: 0 8px 25px rgba(78, 205, 196, 0.4);
                                                    border: none;
                                                    cursor: pointer;
                                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(78, 205, 196, 0.5)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 8px 25px rgba(78, 205, 196, 0.4)';">
                                                    ✓ Accept
                                                </a>
                                            </div>
                                            
                                            <!-- Footer -->
                                            <div style="
                                                margin-top: 50px;
                                                padding-top: 20px;
                                                border-top: 1px solid #eee;
                                            ">
                                                <p style="
                                                    font-size: 0.9rem;
                                                    color: #888;
                                                    margin: 0;
                                                    font-style: italic;
                                                ">
                                                    <span style="
                                                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                        -webkit-background-clip: text;
                                                        -webkit-text-fill-color: transparent;
                                                        background-clip: text;
                                                        font-weight: 600;
                                                    ">Chronikey</span> | Memories that matter
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </body>
                                </html>
                                 `
                            }           
            
            EmailTranspoter.sendMail(MailOptions,err=>{
                if(err){
                    return res.json({status:false,Reason:"Failed to send email",For:"dates"});
                }

                console.log(`Set an invite email to ${UserEmail}`);
            })   
        })
    })
   })
   return res.json({status:true,PostID});

})

app.post("/search",(req,res)=>{
    let SearchToken=req.body.Token;
    console.log("We just recieved a call",SearchToken);
    let query=`SELECT * FROM user_info2 where first_name REGEXP ? OR last_name REGEXP ?`;
    con.query(query,[SearchToken,SearchToken],(err,results)=>{
        if(err) throw err;
        let SearchResults=results.map(result=>({
            TheName:`${result.first_name} ${results.last_name}`,
            user_id:result.id
        }));

        if(results.length==0){
            return res.json({status:false})
        }else{
            return res.json({status:true,Results:SearchResults})
        }
    })
})

app.get("/invite/response",(req,res)=>{
    let Token=req.query.token;
    let Response=req.query.response;
    console.log("The response is:",Response)

    console.log("Trying to decode token");
    jwt.verify(Token,JwtCode,(err,decoded)=>{
        if(err) return res.send("Wenzani");
        console.log(`The event name is: ${decoded.EventName}`);

        if(Response=="true"){
            con.query("UPDATE events SET UserStatus=? WHERE user_id=? AND EventID=?",['Accepted',decoded.User,decoded.EventId],err=>{
                if(err) throw err;
                return res.render("accept",{EventName:decoded.EventName});
            })
        }else{
            con.query("UPDATE events SET UserStatus=? WHERE user_id=? AND EventID=?",['Declined',decoded.User,decoded.EventId],err=>{
                if(err) throw err;
                return res.render("decline",{EventName:decoded.EventName});
            })
        }
    })
})


app.get("/get/a/protection/token/:accessID",NotAuthenticated,(req,res)=>{
    let AccessId=req.params.accessID;
    let Token;

    if(AccessId=="X9F4B7T2QJ"){
        Token=jwt.sign({},"2265",{expiresIn:"20m"});
    }

    if(!Token){
        return res.status(403).json({error:"Invalid access Id"});
    }

    res.json({Token});
})

app.use((req,res,next)=>{
    res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on port ${PORT}`);
});

