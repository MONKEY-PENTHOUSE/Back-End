const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const request = require('request');
const secret_config = require('../../../config/secret');
const nodeCache = require('node-cache');
const twilio = require('twilio');

const userDao = require('../dao/userDao');
//const profileDao = require('../dao/profileDao');

const codeCache = new nodeCache({stdTTL: 180, checkperiod: 200});
const client = new twilio(secret_config.twilioSid, secret_config.twilioToken);

//signUp API = MP자체 회원가입

exports.signUp = async function (req, res) {
    const {
        userName,userPhone,userEmail,userPassword,userBirth,userSex
    } = req.body;

    if(!userName){
        return res.json({
            isSuccess: false, 
            code: 301, 
            message: "이름을 입력해주세요"
        });
    }
    if (!userEmail) {
        return res.json({
            isSuccess: false, 
            code: 301, 
            message: "이메일을 입력해주세요."
        });
    }
    if (userEmail.length > 30) {
        return res.json({
            isSuccess: false,
            code: 302,
            message: "이메일은 30자리 미만으로 입력해주세요."
        });
    }
    if (!regexEmail.test(userEmail)) {
        return res.json({
            isSuccess: false, 
            code: 303, 
            message: "이메일을 형식을 정확하게 입력해주세요."
        });
    }

    if (!userPassword) {
        return res.json({
            isSuccess: false, 
            code: 304, 
            message: "비밀번호를 입력 해주세요."
        });
    }
    if (userPassword.length < 6 || userPassword.length > 20) {
        return res.json({
            isSuccess: false,
            code: 305,
            message: "비밀번호는 6~20자리를 입력해주세요."
        });
    }
    const num = userPassword.search(/[0-9]/g);
    const eng = userPassword.search(/[a-z]/ig);
    const spe = userPassword.search(/[`~!@@#$%^&*|₩₩₩'₩";:₩/?]/gi);

    if(num < 0 || eng < 0 || spe < 0){
        return res.json({
            isSuccess: false,
            code: 317,
            message: "비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 입력해주세요."
        });
    }
    if (!userPhone){
        return res.json({
            isSuccess: false,
            code: 204,
            message: "핸드폰 번호를 입력해주세요."
        });
    }
    const phone = /^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$/;
    if(!phone.test(userPhone)){
        return res.json({
            isSuccess: false,
            code: 340,
            message: "올바른 핸드폰 번호를 입력해주세요."
        });
    }
    if (!userSex){
        return res.json({
            isSuccess: false,
            code: 305,
            message: "성별을 입력해주세요"
        });
    }
    if (!userBirth){
        return res.json({
            isSuccess: false,
            code: 305,
            message: "생일을 입력해주세요"
        });
    }
        try {
            // 이메일 중복 확인
            const emailRows = await userDao.userEmailCheck(email);
            if (emailRows.length > 0) {

                return res.json({
                    isSuccess: false,
                    code: 308,
                    message: "중복된 이메일입니다."
                });
            }
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            const insertUserInfoParams = [userName,userPhone,userEmail,userPassword,hashedPassword,userBirth,userSex];
            const insertUserRows = await userDao.insertUserInfo(insertUserInfoParams);
            return res.json({
                isSuccess: true,
                code: 200,
                message: "회원가입 성공"
            });
        } catch (err) {
            logger.error(`App - SignUp Query error\n: ${err.message}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
};

// 휴대폰번호 인증 API
exports.sendPhoneCode = async function(req, res){
    const {
        phoneNumber
    } = req.body;

    if (!phoneNumber){
        return res.json({
            isSuccess: false,
            code: 204,
            message: "핸드폰 번호를 입력해주세요."
        });
    }

    const phone = /^[0-9]{2,3}[0-9]{3,4}[0-9]{4}$/;
    if(!phone.test(phoneNumber)){
        return res.json({
            isSuccess: false,
            code: 340,
            message: "올바른 핸드폰 번호를 입력해주세요."
        });
    }

    try{
        const randomCode = Math.floor(Math.random() * 900000) + 100000;
        const success = codeCache.set(phoneNumber, {"randomCode": `${randomCode}`});

        if(success === true){
            client.messages.create({
                body: `몽키펜트하우스에 오신걸 환영합니다! 인증번호는  [${randomCode}] 입니다 `,
                to: `+82${phoneNumber}`,
                from: '+1024470662'
            })
            .catch(error => res.status(500).send(`Error: ${error}`));
            
            return res.status(200).json({
                isSuccess: true,
                code: 100,
                message: "문자 발송 성공"
            });

        }else{
            return res.json({
                isSuccess: false,
                code: 300,
                message: "서버 오류로 문자메세지를 보내는데 실패했습니다. 고객센터에 문의해주세요."
            });
        }
    }catch (err) {
        logger.error(`Send Auth Code Message Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};
//문자 인증 번호 확인 API
exports.checkPhoneCode = async function(req, res){
    const {
        userPhone,authCode
    } = req.body;

    const value = codeCache.get(userPhone);

    if (!userPhone){
        return res.json({
            isSuccess: false,
            code: 204,
            message: "핸드폰 번호를 입력해주세요."
        });
    }
    if (!authCode){
        return res.json({
            isSuccess: false,
            code: 221,
            message: "인증번호를 입력해주세요."
        });
    }
    if(value == undefined){
        return res.json({
            isSuccess: false,
            code: 222,
            message: "인증번호가 발급되지 않았습니다."
        });   
    }
    try{
        if(authCode == value.randomCode){
            codeCache.del(phoneNumber);

            let token = jwt.sign({
                phoneNumber: phoneNumber
            },
            secret_config.jwtauth,
            {
                expiresIn: '1d',
                subject: 'phoneNumberInfo'
            });

            return res.json({
                jwt: token,
                isSuccess: true,
                code: 100,
                message: "인증번호 확인 성공"
            });

        }else{
            return res.json({
                isSuccess: false,
                code: 329,
                message: "인증번호가 일치하지 않습니다."
            });
        }
    }catch (err) {
        logger.error(`Check Auth Code Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};

//mpSignInAPI = MP자체 로그인

exports.signIn = async function (req, res) {
    const {
        userEmail, userPassword
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    

    if (!regexEmail.test(userEmail)){
        return res.json({
            isSuccess: false, 
            code: 303, 
            message: "이메일을 형식을 정확하게 입력해주세요."});
    }
    if (!userPassword){
         return res.json({
             isSuccess: false, 
             code: 304, 
             message: "비밀번호를 입력 해주세요."
            });
    }
    try {
        const [userInfoRows] = await userDao.selectUserInfo(userEmail)

        if (userInfoRows.length < 1) {
            connection.release();
            return res.json({
                isSuccess: false,
                code: 310,
                message: "이메일를 확인해주세요."
            });
        }
        //const hashedPassword = await crypto.createHash('sha512').update(userPassword).digest('hex');
        if (userInfoRows[0].pswd !== hashedPassword) {
            connection.release();
            return res.json({
                isSuccess: false,
                code: 311,
                message: "비밀번호를 확인해주세요."
            });
        }
        if (userInfoRows[0].status === "INACTIVE") {
            connection.release();
            return res.json({
                isSuccess: false,
                code: 312,
                message: "비활성화 된 계정입니다. 고객센터에 문의해주세요."
            });
        } else if (userInfoRows[0].status === "DELETED") {
            connection.release();
            return res.json({
                isSuccess: false,
                code: 313,
                message: "탈퇴 된 계정입니다. 고객센터에 문의해주세요."
            });
        }
        //토큰 생성
        let token = await jwt.sign({
                id: userInfoRows[0].id,
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀 키
            {
                expiresIn: '365d',
                subject: 'userInfo',
            } // 유효 시간은 365일
        );

        res.json({
            userInfo: userInfoRows[0],
            jwt: token,
            isSuccess: true,
            code: 200,
            message: "로그인 성공"
        });

        connection.release();
    } catch (err) {
        logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
        connection.release();
        return false;
    }
};

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function (req, res) {
    res.json({
        isSuccess: true,
        code: 200,
        message: "검증 성공",
        info: req.verifiedToken
    })
};
//카카오 유저 
exports.kakaoOauth = async function (req, res){
    const {
        kakaoAccessToken, kakaoRefreshToken
    } = req.body;

    var nickname;
    var profileImage;
    var loginID;

    const insertKakaoUserInfo = async function (loginID, nickname, kakaoRefreshToken, profileImage){
        try{
            const connection = await pool.getConnection(async (conn) => conn);
            try{
                const [loginIDRows] = await userDao.checkUserLoginID(loginID);
        
                if (loginIDRows[0].exist == 1) {
                    const [userInfoRows] = await userDao.selectUserInfo(loginID);
                    
                    let token = jwt.sign({
                        userID: userInfoRows[0].userID,
                        method: userInfoRows[0].method
                    },
                    secret_config.jwtsecret,
                    {
                        expiresIn: '7d',
                        subject: 'userInfo',
                    });

                    res.json({
                        userID: userInfoRows[0].userID,
                        nickname: userInfoRows[0].nickname,
                        jwt: token,
                        isSuccess: true,
                        code: 100,
                        message: "카카오 계정으로 로그인 성공(홈화면으로 이동)"
                    })

                }else{
                    await connection.beginTransaction();

                    const insertUserInfoParams = [loginID, nickname, kakaoRefreshToken, 'K'];
                    await userDao.insertKakaoUserInfo(insertUserInfoParams);
                    const [userInfoRows] = await userDao.selectUserInfo(loginID);
                    const insertProfileImageParams = [userInfoRows[0].userID, profileImage];
                    await profileDao.insertProfileImage(insertProfileImageParams);
        
                    await connection.commit();

                    let token = jwt.sign({
                        userID: userInfoRows[0].userID,
                        method: 'K'
                      },
                      secret_config.jwtsecret,
                      {
                        expiresIn: '7d',
                        subject: 'userInfo'
                      });
                    
                    res.json({
                        userID: userInfoRows[0].userID,
                        nickname: userInfoRows[0].nickname,
                        jwt: token,
                        isSuccess: true,
                        code: 101,
                        message: "카카오 계정으로 첫 로그인 성공(핸드폰 번호 입력 화면으로 이동)"
                    });
                }

                connection.release();

            }catch (err) {
                await connection.rollback();
                connection.release();
                logger.error(`KAKAO Login Query error\n: ${JSON.stringify(err)}`);
                return false;
            }
        }catch (err) {
            logger.error(`KAKAO Login DB connection error\n: ${JSON.stringify(err)}`);
            return false;
        }
    };

    const option = {
        url: 'https://kapi.kakao.com/v2/user/me',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${kakaoAccessToken}`
        },
        body: 'property_keys=["properties.thumbnail_image"]'
    };

    const p = new Promise(
        (resolve, reject) => {
            request(option, (err, res, body) => {
                if(err){
                    reject(err);
                };
                
                const json = JSON.parse(body);

                nickname = json.properties.nickname;
                loginID = json.id;
                
                if(json.kakao_account.profile.thumbnail_image_url){
                    profileImage = json.kakao_account.profile.thumbnail_image_url;
                }else{
                    profileImage = null;
                }
                resolve()
            })
        }
    );

    const onError = (error) => {
        res.status(403).json({
            isSuccess:false,
            code: 216,
            message:"KaKao API UserInfo error"
        })
    };

    p.then(()=>{
        insertKakaoUserInfo(loginID, nickname, kakaoRefreshToken, profileImage);
    }).catch(onError)
};