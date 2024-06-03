## GENERIC

* 컴파일시 타입을 체크하는 기능 JDK 1.5 추가
* 제네릭은 클래스 내부에서 사용할 데이터 타입을 외부에서 지정하는 기법이다.
* 제네릭을 사용하면 클래스 내부에서 사용할 데이터 타입을 컴파일 시점에 체크할 수 있으므로 타입 안정성을 높이고 형 변환의 번거로움이 줄어든다.
* 비슷한 기능을 지원하는경우 코드의 재사용성 높아짐
```
public static void main(String[] args) {
    ArrayList list = new ArrayList();
    list.add(1);
    list.add("2");
    list.add(3.0);
    Integer i = (Integer) list.get(1); // ClassCastException
    System.out.println(list);
}
```

### 사용법

```
@Setter
@Getter
class ClassA<T> {
    private T t;
    public T genericMethod(T o) {
        return o;
    }
    public static <T> T staticGenericMethod(T o) {
        return o;
    }
}

interface InterfaceA<T> {
    T get();
}

public class GenericTest {
    public <T> void genericMethod(T t) {
        System.out.println(t);
    }
    public static void main(String[] args) {
        ClassA<String> classA = new ClassA<>();
        classA.setT("Hello");
        System.out.println(classA.getT());
        System.out.println(classA.genericMethod("World"));
        System.out.println(ClassA.staticGenericMethod("Static"));
        InterfaceA<String> interfaceA = () -> "Interface";
        System.out.println(interfaceA.get());
    
    }
}

interface Readable {}
interface Closeable {}

class BoxType implements Readable, Closeable {}

class Box<T extends Readable & Closeable> {
    List<T> list = new ArrayList<>();

    public void add(T item) {
        list.add(item);
    }
}
```
* 제네릭 클래스 선언은 클래스명 뒤에 <T>를 붙여서 선언한다.
* 제네릭 메소드 선언은 반환 타입 앞에 <T>를 붙여서 선언한다.
* 제네릭 메소드는 제네릭 클래스가 아니더라도 정의할수 있다.
* static 메소드일경우 메소드명 앞에 <T>를 붙여야 사용할수 있다.
* 인터페이스 선언시에도 제네릭을 사용할 수 있다.
* 제네릭 타입 객체는 생성 불가 `T t = new T();`
* 인터페이스는 다중 타입 제한이 가능하다.
* 제네릭 타입의 상속은 extends 키워드를 사용한다.

### 타입 파라미터 기호 네이밍

| 기호 | 의미 |
|---|---|
| T | Type |
| E | Element |
| K | Key |
| V | Value |
| N | Number |
| S, U, V | 두번째, 세번째, 네번째 타입 |

### 제네릭 와일드 카드

* 제네릭은 상하 관계가 없고 전달받은 딱 그 타입으로만 서로 캐스팅 가능
* 와일드 카드는 클래스나 인터페이스 제네릭을 설계할땐 사용할수 없다.
```
class Sample<? extends T> { // ! Error
}
```

|   와일드 카드    |                네이밍                 |         설명         |
|:-----------:|:----------------------------------:|:------------------:|
|      ?      |  Unbounded wildcards(비한정적 와일드 카드  | 제한 없음 (모든 타입이 가능)  |
| ? extends U | Upper Bounded wildcards(상한 제한 와일드 카드) | 상위 클래스 제한 (U와 그 자손들만 가능)상한이 U라 상한 경계라고 한다. |
| ? super T  | Lower Bounded wildcards(하한 제한 와일드 카드) | 하위 클래스 제한 (T와 그 조상들만 가능)하한이 T라 하한 경계라고 한다. |
```
public class GenericTest {
    public static void main(String[] args) {
        Box<? extends Fruit> upBox1 = new Box<Fruit>();
        Box<? extends Fruit> upBox2 = new Box<Apple>();
        Box<? extends Fruit> upBox3 = new Box<Banana>();
        Box<? super Fruit> downBox1 = new Box<Fruit>();
        Box<? super Fruit> downBox2 = new Box<Food>();
        Box<? super Fruit> downBox3 = new Box<Object>();
        Box<?> box1 = new Box<Vegetable>();
        Box<?> box2 = new Box<Fruit>();
        Box<?> box3 = new Box<Food>();
        Box<?> box4 = new Box<Object>();
        Box<?> box5 = new Box<Carrot>();
    }
}
// 제네릭 타입 클래스
class Box<T> {}
class Food {}
class Fruit extends Food {}
class Vegetable extends Food {}
class Apple extends Fruit {}
class Banana extends Fruit {}
class Carrot extends Vegetable {}
```

### PECS 공식

* 외부에서 온 데이터를 생산(Producer) 한다면 <? extends T> 를 사용 (하위타입으로 제한)
* 외부에서 온 데이터를 소비(Consumer) 한다면 <? super T> 를 사용 (상위타입으로 제한)
```
class MyArrayList<T> {
    Object[] element = new Object[5];
    int index = 0;

    // 외부로부터 리스트를 받아와 매개변수의 모든 요소를 내부 배열에 추가하여 인스턴스화 하는 생성자
    public MyArrayList(Collection<? extends T> in) {
        for (T elem : in) {
            element[index++] = elem;
        }
    }
}
class MyArrayList2<T> {
    Object[] element = new Object[5];
    int index = 0;
    
    // 외부로부터 리스트를 받아와 내부 배열의 요소를 모두 매개변수에 추가해주는 메서드
    public void clone(Collection<? super T> out) {
        for (Object elem : element) {
            out.add((T) elem);
        }
    }
}
```