type ResultType = [boolean, string]
const doSomething = (): ResultType => {
    try {
        throw new Error('some error occurs...')
    }catch (e){
        return [false, e.message]
    }
}
const [result, errorMessage] = doSomething();