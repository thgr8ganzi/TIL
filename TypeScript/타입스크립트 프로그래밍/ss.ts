interface ISquare {size: number}
interface IRectangle {width: number, height:number}
interface ICircle {radius:number}
const square:ISquare = {size:10}
const rectangle:IRectangle = {width:4, height:5}
const circle:ICircle = {radius: 10}
type IShape = ISquare | IRectangle | ICircle
const calcArea = (shape:IShape):number => {
    return 0
}