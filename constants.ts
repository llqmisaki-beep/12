
// Since browsers cannot access YouTube transcripts directly without a proxy due to CORS/Anti-scraping,
// We will mock the "Raw Transcript" phase to demonstrate the Gemini summarization logic.

export const DEMO_VIDEO_URL = "https://www.bilibili.com/video/BV1xx411c7mD"; // Example Bilibili URL structure

export const MOCK_RAW_TRANSCRIPT = `
大家好，欢迎回到我的频道。今天我们来聊一个非常扎心的话题：为什么你明明工资不低，但一年下来却存不到钱？
很多人觉得是因为房价太高、物价太贵，或者是工资涨得不够快。当然，这些都是客观原因。但我发现，对于大多数普通人来说，真正偷走你存款的，其实是你生活中的“拿铁因子”。
什么叫拿铁因子？这个概念最早是由大卫·巴赫提出的。就是说你每天早上上班前习惯买的那杯拿铁咖啡，看起来只要 30 块钱，不贵对吧？但是如果不买这杯咖啡，你并没有觉得生活质量下降多少。但如果你每天都买，一年下来就是一万多块钱。
这不仅仅是指咖啡，它是指所有那些非必要、但习惯性的微小支出。比如你为了凑单满减买的零食，为了视频网站会员充的自动续费，还有那些你买回来只穿了一次的打折衣服。
记账不是为了让你变得抠门，不是为了让你省钱，而是为了让你“看见”你的钱都去哪了。很多人害怕记账，因为不敢面对真实的自己。
我给新手的建议是：强制储蓄。发工资的第一件事，不是还信用卡，不是去吃大餐，而是先把 20% 的钱转到一个你平时不用的账户里，雷打不动。
种一棵树最好的时间是十年前，其次是现在。存钱也是一样。不要觉得现在存的少没有意义，复利的力量是惊人的。
最后我想说，存钱的最终目的，不是为了做一个守财奴，而是为了在生活给你一巴掌的时候，你有底气反手给它一巴掌。
`;

export const MOCK_VIDEO_METADATA = {
  title: "【搞钱必看】为什么你存不下钱？揭秘生活中的“拿铁因子”",
  thumbnail: "https://picsum.photos/id/20/800/450", // Using a generic image for demo
  durationStr: "08:45",
  durationSec: 525
};
