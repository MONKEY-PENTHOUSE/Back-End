const express = require('express');
const compression = require('compression');
// 웹 페이지나 어플리케이션 화면 데이터 크기가 클 때 압축해주는 미들웨어
const methodOverride = require('method-override');
var cors = require('cors');
module.exports = function () {
    const app = express();

    app.use(compression());

    app.use(express.json());

    app.use(express.urlencoded({extended: true}));
    //extended : true일 경우, 객체 형태로 전달된 데이터내에서 또다른 중첩된 객체를 허용한다는 말이며, false인 경우에는 허용하지 않는다는 말
    app.use(methodOverride());
    // put하고 delete사용할 때 사용

    app.use(cors());
    // app.use(express.static(process.cwd() + '/public'));
    // CORS 허용해줄 도메인 cors 미들웨어 사용해준다.

    /* App (Android, iOS) */
    //require('../src/app/routes/indexRoute')(app);
    require('../src/app/routes/userRoute')(app);
    /* Web */
    //require('../src/web/routes/indexRoute')(app);
    return app;
};