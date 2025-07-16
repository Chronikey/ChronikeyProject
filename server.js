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
app.get('/',NotAuthenticated,(req,res)=>{
    res.render('home')
});
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

con.query('SELECT NOW()',(err,results)=>{
    if(err) throw err;
    console.log(results)
})

console.log(moment().format("YYYY-MM-DD HH:mm"))

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

app.get('/login',(req,res)=>{
    res.render('login',{loginError:req.flash('error')});
});

app.get('/register',(req,res)=>{
    res.render('register',{ErrorMessage:''});
});

app.get('/upload/to/locked',(req,res)=>{
    res.render('uploadlocked');
});

app.post('/login',passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/login',
    failureFlash:true
}))

function NotAuthenticated(req,res,next){
    if(!req.isAuthenticated()){
        return res.redirect('/login');
    }

    return next()
}

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

app.get("/list/locked",(req,res)=>{
    con.query("SELECT * FROM LockedMemories",(err,results)=>{
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
app.post('/upload/to/locked/:accessToken',upload.array("FileContent",5),(req,res)=>{
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
        con.query("INSERT INTO LockedMemories VALUES(?,?,?,?,?,?,?,?,?,?,?)",[uuid.v4(),uuid.v1(),req.body.MemoryName,JSON.stringify(Images),"null",req.body.message,req.body.feelings,req.body.openDateTime,dayjs().format("YYYY-MM-DD HH:mm"),os.type(),req.ip],err=>{
            if(err) throw err;
            return res.json({Status:true});
        })
    })
})

app.use((req,res,next)=>{
    res.status(404).render('404');
});

app.get("/get/a/protection/token/:accessID",(req,res)=>{
    console.log("Recieved a call")
    let AccessId=req.params.accessID;
    let Token;

    if(AccessId=="X9F4B7T2QJ"){
        console.log("Code matching");
        Token=jwt.sign({},"2265",{expiresIn:"20m"});
    }

    if(!Token){
        return res.status(403).json({error:"Invalid access Id"});
    }

    res.json({Token});
})

app.listen(PORT, () => {
  console.log(`${APP_NAME} running on port ${PORT}`);
});

