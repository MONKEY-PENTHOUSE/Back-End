const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

/**
 update : 2020.10.4
 01.signUp API = 회원가입
 */
exports.signUp = async function (req, res) {
    const {
        email, password, nickname
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요."});
    if (password.length < 6 || password.length > 20) return res.json({
        isSuccess: false,
        code: 305,
        message: "비밀번호는 6~20자리를 입력해주세요."
    });

    if (!nickname) return res.json({isSuccess: false, code: 306, message: "닉네임을 입력 해주세요."});
    if (nickname.length > 20) return res.json({
        isSuccess: false,
        code: 307,
        message: "닉네임은 최대 20자리를 입력해주세요."
    });
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

            // 닉네임 중복 확인
            const nicknameRows = await userDao.userNicknameCheck(nickname);
            if (nicknameRows.length > 0) {
                return res.json({
                    isSuccess: false,
                    code: 309,
                    message: "중복된 닉네임입니다."
                });
            }

            // TRANSACTION : advanced
           // await connection.beginTransaction(); // START TRANSACTION
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            const insertUserInfoParams = [email, hashedPassword, nickname];
            
            const insertUserRows = await userDao.insertUserInfo(insertUserInfoParams);

          //  await connection.commit(); // COMMIT
           // connection.release();
            return res.json({
                isSuccess: true,
                code: 200,
                message: "회원가입 성공"
            });
        } catch (err) {
           // await connection.rollback(); // ROLLBACK
           // connection.release();
            logger.error(`App - SignUp Query error\n: ${err.message}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
};

/**
 update : 2020.10.4
 02.signIn API = 로그인
 **/
exports.signIn = async function (req, res) {
    const {
        email, password
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요."});
        try {
            const [userInfoRows] = await userDao.selectUserInfo(email)

            if (userInfoRows.length < 1) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 310,
                    message: "아이디를 확인해주세요."
                });
            }

            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
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