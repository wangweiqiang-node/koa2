const Koa = require('koa')
const app = new Koa()
// const router = require('koa-router')({
//   prefix: '/api'
// })
const router = require('koa-router')()
const cors = require('koa2-cors')
// const co = require('co');
// const convert = require('koa-convert');
const logger = require('koa-logger')
const json = require('koa-json')
// const views = require('koa-views');
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')

//log工具
const logUtil = require('./utils/log_util')

const response_formatter = require('./middlewares/response_formatter')
const {
  connect,
  initSchemas
} = require('./routes/database/init.js')

// middlewares
app.use(cors())
// 加入解析post请求中body的中间件
app.use(bodyparser())
// 加入解析json的中间件
app.use(json())
// 加入log记录的中间件
app.use(logger())
// 设置静态资源目录 - 根目录下的public文件夹内
app.use(require('koa-static')(__dirname + '/public'))

// 视图
// app.use(views(__dirname + '/views', {
//   extension: 'jade'
// }));

// 定义路由
let user = require('./routes/appApi/user.js')
let home = require('./routes/appApi/home.js')
let goods = require('./routes/appApi/goods.js')

// logger
app.use(async (ctx, next) => {
  const start = new Date() //响应开始时间
  var ms //响应间隔时间
  try {
    await next() //开始进入到下一个中间件
    ms = new Date() - start
    logUtil.logResponse(ctx, ms) //记录响应日志
  } catch (error) {
    ms = new Date() - start
    //记录异常日志
    logUtil.logError(ctx, error, ms)
  }
})
//添加格式化处理响应结果的中间件，在添加路由之前调用
//仅对/api开头的url进行格式化处理
app.use(response_formatter('^/api'))
// 子路由
router.use('/user', user.routes(), user.allowedMethods())
router.use('/home', home.routes(), home.allowedMethods())
router.use('/goods', goods.routes(), goods.allowedMethods())

// 使路由生效
app.use(router.routes(), router.allowedMethods())

;
(async () => {
  await connect()
  initSchemas()
})()

// 监听错误
app.on('error', function (err, ctx) {
  console.log('server  start===========')
  logger.error('server error', err, ctx)
  console.log('server end===========')
})

module.exports = app