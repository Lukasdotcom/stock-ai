// This will give how much the bot wants to buy or sell. This number is in the range of -1 to 1
export function prediction(botStrategy, time, stockData) {
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

export async function simulateBestBotStock(ticker) {

}