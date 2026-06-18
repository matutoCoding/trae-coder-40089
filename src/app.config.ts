export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/conflict/index',
    'pages/queue/index',
    'pages/priority/index',
    'pages/booking-detail/index',
    'pages/donor-info/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#E53935',
    navigationBarTitleText: '血站采血车排班系统',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#E53935',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '采血排期'
      },
      {
        pagePath: 'pages/conflict/index',
        text: '冲突校验'
      },
      {
        pagePath: 'pages/queue/index',
        text: '排队叫号'
      },
      {
        pagePath: 'pages/priority/index',
        text: '优先插队'
      }
    ]
  }
})
