const jwt = require('jsonwebtoken');
// jsonwebtoken기반 로그인 방식 구현
const secret_config = require('./secret');
// 미들웨어 만들어줘서 사용
const jwtMiddleware = (req, res, next) => {
    //url로 부터 토큰을 읽어들인다.
    const token = req.headers['x-access-token'] || req.query.token;
    // token does not exist
    if(!token) {
        return res.status(403).json({
            isSuccess:false,
            code: 403,
            message: '로그인이 되어 있지 않습니다.'
        });
    }
    //비동기작업들을 순차적으로 진행해주는 promise를 생성하고 토큰을 해독하는 함수를 넣는다.
    const p = new Promise(
        (resolve, reject) => {
            jwt.verify(token, secret_config.jwtsecret , (err, verifiedToken) => {
                if(err) reject(err);
                resolve(verifiedToken)
            })
        }
    );
    // 토큰 유효성검사 실패시, 검증실패 res를 뿌린다.
    const onError = (error) => {
        res.status(403).json({
            isSuccess:false,
            code: 403,
            message:"검증 실패"
        });
    };

    // promise과정
    p.then((verifiedToken)=>{
        //비밀 번호 변경됐을 때 검증 부분 추가 할 곳
        req.verifiedToken = verifiedToken;
        next();
    }).catch(onError)
};

module.exports = jwtMiddleware;