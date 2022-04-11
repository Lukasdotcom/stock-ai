// This will give how much the bot wants to buy or sell. This number is in the range of -1 to 1
export function predict(botStrategy, time, stockData) {
    let comparison = stockData[time - 1]
    let count = 1
    let total = 0
    botStrategy.forEach(element => {
        if (count == 1) {
            total += element
        } else {
            if (time - count >= 0) {
                total += element * ((stockData[time - count]/comparison)-1)
            } else {
                total += element * ((stockData[0]/comparison)-1)
            }
        }
        count ++
    })
    if (total > 1) {
        total = 1
    } else if (total < -1) {
        total = -1
    }
    return total
}

export function simulateBot(startTime, stockData, botStrategy) {
    // Used to run through a bot and generate data for the bot starting at startTime
    let money = stockData[startTime]
    let stocks = 0
    let bot = []
    for (let count = startTime; count < stockData.length; count++) {
        let order = predict(botStrategy, count, stockData)
        if (order < 0) {
            order *= -1
            money += stocks * stockData[count] * order
            stocks *= 1 - order
        } else {
            stocks += money / stockData[count] * order
            money *= 1 - order
        }
        bot.push(stocks * stockData[count] + money)
    }
    return bot
}