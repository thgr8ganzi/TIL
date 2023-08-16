
## Promise 와 async/await 구문

--------------

### 비동기 콜백 함수

* 파일을 동기와 비동기로 읽는 코드
* 파일내용을 모두 읽을때 까지 프로그램의 동작을 잠시 멈추는 방식이 아닌 콜백함수로 얻게하는 비동기 방식의 API를 제공한다.
```
import {readFileSync, readFile} from 'fs'

const buffer: Buffer = readFileSync('./package.json')
console.log(buffer.toString())

readFile('./package.json', (error:Error, buffer: Buffer) => {
    console.log(buffer.toString())
})
const readFilePromise = (filename: string):Promise<string> => 
    new Promise<string>((resolve, reject) => {
        readFile(filename, (error:Error, buffer:Buffer) => {
            if(error) reject(error)
            else resolve(resolve.toString())
        })
    });
(async () => {     
    const content = await readFilePromise('./package.json')
})()
```
* Buffer 는 node.js 에서 제공하는 클래스로 바이너리 데이터를 저장하는 기능을 수행한다.
* Buffer 데이터를 문자열로 만들때 toString 메서드는 사용한다.
* 자바스크립트는 단일스레드로 동작하므로 readFileSync 같은 동기 API 사용은 지양한다.
* 비동기 API 를 사용하면 콜백함수에서 또 다른 비동기 API를 호출할때 콜백지옥이 생기므로 Promise 는 이런 구조를 다루기 쉬운코드로 만들려는 목적으로 고안되었다.

### Promise 이해하기

* 프로미스는 ES6 정식 기능이다.
* Promise 이름의 클래스이며 new 연산자를 적용해 프로미스 객체를 만들어야 한다.
* Promise 는 resolve 와 reject 두개의 매개 변수를 가지며 제네릭클래스로 사용할수 있다.
```
import {readFile} from 'fs'
const readFilePromise = (filename:string): Promise<string> => 
    new Promise<string>((
        resolve: (value:string) => void,
        reject: (error:Error) => void) => {
            readFile(filename, (err:Error, buffer:Buffer) => {
                if(err) reject(err)
                else resolve(buffer.toString())
            })
    })
readFilePromise('./package.json')
.then((content:string) => {
    console.log(content)
    return readFilePromise('./tsconfig.json')
})
.then((content:string) => {
    console.log(content)
    return readFilePromise('.')
})
.catch((err:Error) => console.log(err))
.finally(() => console.log('종료'))

Promise.resolve(1)
.then(value => console.log(value))

Promise.reject(new Error('에러'))
.catch((err:Error) => console.log(err))
```
* Promise.resolve(값) 메서드는 then 메서드 안에서 얻을수 있다. 
* Promise.reject(Error 타입 객체) 메서드는 catch 메서드의 콜백함수 안에서 값을 얻을수 있다.
* Array 클래스는 every 라는 이름의 인스턴스 메서드를 제공하며 every 메서드는 배열의 모든 아이템이 어떤 조건을 만족하면 true 를 반환한다.
```
const isAllTrue = (values: boolean[]) => values.every((values => values === true))
console.log(
    isAllTrue([true, true, true]), // true
    isAllTrue([false, true, true]), // false
)
```
* Promise 클래스는 all 이라는 이름의 메서드를 제공하는데 Promise 객체들의 배열 형태로 받아 모든 객체를 대상으로 resolve 된 값들을 배열로 만들어 준다.
* then 메서드를 통해서 얻어야 하며 reject 가 발생하면 더 기다리지 아낳고 reject 를 반환하고 catch 를 통해 얻어야 한다.
```
const getAllResolvedResult = <T>(promise: Promise<T>[]) => Promise.all(promise)

getAllResolvedResult<any>([Promise.resolve(true), Promise.resolve('hello')])
.then(result => console.log(result)) // [true, hello]

getAllResolvedResult<any>([Promise.reject(new Error('error')), Promise.resolve(1)])
.then(result => console.log(result)) // 호출 x
.catch(error => console.log(error)) // error 메시지
```
* Array 클래스는 배열중 하나라도 만족하면 true 를 반환하는 some 인스턴스 메서드를 제공한다.
```
const isAnyTrue = (value:boolean[]) => value.some((value => value == true))

console.log(
    isAnyTrue([false, true, false]), // true
    isAnyTrue([false, false, false]) // false
)
```
* Promise.race 메서드는 배열에 담긴 프로미스중 하나라도 resolve 되면 이 값을 담은 객체를 반환한다.
* reject 가 제일 먼저 발생하면 reject 를 반환한다.
```
Promise.race([Promise.resolve(true), Promise.resolve('hello')])
.then(value => console.log(value)) // tr

Promise.race([Promise.resolve(true), Promise.reject(new Error('hello'))])
.then(value => console.log(value)) // true
.catch(error => console.log(error.message)) // 호출 x

Promise.race([Promise.reject(new Error('error')), Promise.resolve(true)])
.then(value => console.log(value)) // 호출 x
.catch(error => console.log(error.message)) // error
```

### async 와 await 구문

* 2013년 마이크로소프트는 C#5.0 을 발표하면서 비동기 ㅋ프로그래밍 코드를 비약적으로 간결하게 구현할수 있는 async/await 구문을 제공했다.
```
const test = async () => {
    const value = await Promise.resolve(1)
    console.log(value) // 1
}
test()
```
* await 키워드는 피 연산자의 값을 반환 하고 피연산자가 PRomise 객체이면 then 메서드를 호출해 얻은 값을 반환한다.
* async 는 항상 await 키워드와 같이 사용할수 있다.
```
const test1 = async () => {
    let value = await 1
    console.log(value) // 1
    value = await Promise.resolve(1)
    console.log(value) // 1
}
async function test2() {
    let value = await 'hello'
    console.log(value) // hello
    value = await Promise.resolve('hello')
    console.log(value) // hello
}
test1()
test2()
// 1 hello 1 hello
test1().then(() => test2())
// 1 1 hello hello
```
* async 함수는 흥미로운 성질이 있다
  * 일반 함수처럼 사용가능
  * Promise 객체로 사용 가능
* async 함수는 Promise 형태로 변환되므로 then 메서드를 호출해 반환값을 얻어야 한다.
```
const asyncReturn = async () => {
    return [1, 2, 3]
}
asyncReturn().then(value => console.log(value)) // [1, 2, 3]
```
* 예외가 발생하였을 경우 프로미스 객체의 catch 메서드를 호출하는 방식으로 해야한다.
```
const asyncException = async () =>{
    await Promise.reject(new Error('에러'))
}
asyncException()
.catch(err => console.log(err))
```
* readFilePromise 를 async 적용해보기
```
const readFilesAll = async (filenames: string[]) => {
    return await Promise.all(
        filenames.map(filename => readFilePromise(filename))
    )
}
readFilesAll(['./package.json', './tsconfig.json'])
.then(([packageJson, tsconfigJson]: string[]) => {
    console.log(packageJson, tsconfigJson)
})
.catch(err => console.log(err))
```