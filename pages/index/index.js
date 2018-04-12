//index.js
const weatherMap = {
  'sunny': '晴天',
  'cloudy': '多云',
  'overcast': '阴',
  'lightrain': '小雨',
  'heavyrain': '大雨',
  'snow': '雪'
} // 英文到中文的映射

const weatherColorMap = {
  'sunny': '#cbeefd',
  'cloudy': '#deeef6',
  'overcast': '#c6ced2',
  'lightrain': '#bdd5e1',
  'heavyrain': '#c5ccd0',
  'snow': '#aae1fc'
}

// 引入SDK核心类
const QQMapWX = require('../../libs/qqmap-wx-jssdk.js');

// 定义常量变量，处理权限被拒绝情况
const UNPROMPTED = 0;  // 未弹窗
const UNAUTHORIZED = 1;// 已弹窗拒绝
const AUTHORIZED = 2;  // 已弹窗同意

Page({
  // 对动态变量进行定义和赋值
  data: {
    nowTemp : '14°',
    nowWeather : "cloudy",
    nowWeatherBackground:"",
    hourlyWeather: [],
    todayTemp: "",
    todayDate: "",
    city:"广州市",
    locationAuthType: UNPROMPTED
  },

  onPullDownRefresh(){
    this.getNow(()=>{
      wx.stopPullDownRefresh(); 
      // 传入回调函数，执行wx.stopPullDownRefresh()
    });
  },

  onLoad(){
    console.log("onLoad");
    // 从设置中获取用户是否已经授权
    wx.getSetting({
      success: res=>{
        let auth = res.authSetting["scope.userLocation"];
        this.setData({
          loactionAuthType: auth?AUTHORIZED:(auth===false)?UNAUTHORIZED:UNPROMPTED,
        })
        // 改变城市名称
        if(auth){
          this.getCityAndWeather();
        }
        else{
          this.getNow();
        }
      }
    })
    this.getNow();
    // 不执行wx.stopPullDownRefresh()，因为没有回调函数
    this.qqmapsdk = new QQMapWX({
      key: 'HNGBZ-BFUHG-X3LQ7-IRCTA-NNM2S-SMFMN' // 申请到的key
    })
  },

  onReady: function () {
    console.log("onReady");// Do something when page ready.
  },
  onShow: function () {
    console.log("onShow");// Do something when page show.
  },
  onHide: function () {
    console.log("onHide");// Do something when page hide.
  },
  onUnload: function () {
    console.log("onUnload");// Do something when page close.
  },

  getNow(callback){
      wx.request({
      url: 'https://test-miniprogram.com/api/weather/now',
      data: {
        city: this.data.city
      },
      success: res => {
        console.log(res.data.result)
        let result = res.data.result;
        this.setNow(result);
        this.setHourlyWeather(result);
        this.setToday(result);  
      },
      complete: res =>{
        callback && wx.stopPullDownRefresh();
        // 如果有回调函数就执行，如果没有回调函数就不去执行
      }
    })
  },

  // 设置当前的天气值
  setNow(result){
    let temp = result.now.temp;
    let weather = result.now.weather;
    this.setData({
      nowTemp: temp + '°',
      nowWeather: weatherMap[weather],
      nowWeatherBackground: '/images/' + weather + '-bg.png',
    })

    // 设置导航栏背景颜色
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: weatherColorMap[weather],
    })
  },

  // 设置未来每三小时的天气列表
  setHourlyWeather(result){

    // 运用forecast中的网络数据进行赋值
    let forecast = result.forecast  
    
    // 获取当前时间
    let nowHour = new Date().getHours(); 
    
    // 构建新的hourlyWeather列表
    let hourlyWeather = [];
    for(let i = 0; i < 7; i ++) {
      hourlyWeather.push({
        time: (i * 3 + nowHour) % 24 + '时', // 每隔三小时获取一次
        iconPath: '/images/' + forecast[i].weather + '-icon.png',
        temp: forecast[i].temp + '°',
      })
      hourlyWeather[0].time = '现在'  // 第一项为现在的时间
    }
    this.setData({
      hourlyWeather: hourlyWeather,
    })
  },

  // 显示当天的天气信息
  setToday(result){
    let date = new Date();
    this.setData({
      todayTemp: `${result.today.minTemp}° - ${result.today.maxTemp}°`,
      todayDate: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 今天`, // 月份加1的原因，getMonth()返回值为0-11
    })
  },


  // 点击后响应函数
  onTapDayWeather(){
    wx.navigateTo({
      url: '/pages/list/list?city=' + this.data.city,
    })
  },

  // 点击后获取当前位置
  onTapLocation() {
    if(this.data.locationAuthType === UNAUTHORIZED){
      // 从设置中返回回调函数
      wx.openSetting({  
        success: res=>{
          console.log(res); // 打印返回的内容
          let auth = res.authSetting["scope.userLocation"];
          if(auth){
            this.getCityAndWeather(); // 如果用户同意，再一次获取位置
          }
        }
      });
    }
    else{
      this.getCityAndWeather();
    }
  },

  getCityAndWeather(){
    wx.getLocation({
      success: res => {
        this.setData({
          locationAuthType: AUTHORIZED,
        })
        this.qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: res => {
            let city = res.result.address_component.city;
            console.log(res.result.address_component.city);
            this.setData ({
              city: city,
              locationTipsText: ""
            })
            this.getNow(); // 重新获取新的城市的天气
          }
        });
      },
      fail: () => {
        this.setData({
          locationAuthType: UNAUTHORIZED,
        })
      }
    })
  }
})
