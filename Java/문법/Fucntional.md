## Functional

* 자바는 oop 인 동시의 JDK 1.8 부터 함수형 프로그래밍을 지원한다.
* 빅데이터가 뜨면서 많은 데이터를 처리하기 위해 함수형 프로그래밍이 각광받고 있다.

### 람다

* 함수(메소드)를 간단한 식(expression)으로 표현하는 방법
* 익명함수(anonymous function)를 만들어서 사용하는 방법
* 함수와 메서드 차이
  * 근본적으로는 동일, 함수는 일반적 용어, 메소드는 객체지향 개념 용어
  * 함수는 클래스에 독립적, 메소드는 클래스에 종속적
```
(a, b) -> a + b
```
* 매개변수가 하나일경우 괄호 생략가능(타입 없을때만)
```
a -> a * a
```
* 블록안의 문장이 하나뿐일때 괄호{} 생략 가능
* return 문도 생략 가능
```
int i -> {
    System.out.println(i);
}
int i -> System.out.println(i)
```
* 람다식은 익명 객체
* 객체 선언과 생성 동시에 함
```
new Object() {
    int max(int a, int b) {
        return a > b ? a : b;
    }
}
(a, b) -> a > b ? a : b
```

### 함수형 인터페이스

* 단 하나의 추상 메서드만 선언된 인터페이스
* @FunctionalInterface 어노테이션을 사용하여 함수형 인터페이스임을 명시
* 함수형 인터페이스 타입의 참조변수로 람다식을 참조할수 있(함수형 인터페이스의 메서드와 람다식의 매개변수 개수와 반환타입이 일치해야함)
```
@FunctionalInterface
interface MyFunction {
    public abstract int max(int a, int b);
}
@FunctionalInterface
interface MyFunction2 {
    void run();
}
class MyFunctionClazz {
    static void execute(MyFunction2 myFunction2) {
        myFunction2.run();
    }
    static MyFunction2 getMyFunction2() {
        return () -> System.out.println("run");
    }
    public static void main(String[] args) {
        MyFunction myFunction = Math::max;
        System.out.println(myFunction.max(1, 2));

        MyFunction2 myFunction2 = () -> System.out.println("run1");
        MyFunction2 myFunction3 = new MyFunction2() {
            @Override
            public void run() {
                System.out.println("run2");
            }
        };
        MyFunction2 myFunction4 = MyFunctionClazz.getMyFunction2();
        myFunction2.run();
        myFunction3.run();
        myFunction4.run();
    }
}
```

### java.util.function 패키지

#### 자주 사용되는 다양한 함수형 인터페이스 제공

* java.lang.Runnable : void run(), 매개 변수도 없고 반환값 없음
* Supplier<T> : T get(), 매개 변수 없고 반환값 있음
* Consumer<T> : void accept(T t), Supplier 와 반대로 매개변수 있고 반환값 없음
* Function<T, R> : R apply(T t), 일반적인 함수, 하나의 매개변수 받고 결과 반환
* Predicate<T> : boolean test(T t), 조건식 표현하는데 사용, 매개변수는 하나, 반환타입 boolean

#### 두개의 매개변수

* BiConsumer<T, U> : void accept(T t, U u), 두개의 매개변수, 반환값 없음
* BiPredicate<T, U> : boolean test(T t, U u), 두개의 매개변수, 반환값 boolean
* BiFunction<T, U, R> : R apply(T t, U u), 두개의 매개변수, 반환값 하나

#### 매개 변수와 반환 타입 일치

* UnaryOperator<T> : T apply(T t), Function 의 자손, Function 과 달리 매개변수와 결과의 타입이 같다
* BinaryOperator<T> : T apply(T t1, T t2), BiFunction 의 자손, BiFunction 과 달리 매개변수와 결과의 타입이 같다

```
public class FunctionalTest {
    public static void main(String[] args) {
        Supplier<Integer> s = () -> (int) (Math.random() * 100) + 1;
        Consumer<Integer> c = i -> System.out.print(i + ", ");
        Predicate<Integer> p = i -> i % 2 == 0;
        Function<Integer, Integer> f = i -> i / 10 * 10;

        List<Integer> list = new ArrayList<>();
        makeRandomList(s, list);
        System.out.println(list);
        printEvenNum(p, c, list);
        List<Integer> newList = doSomething(f, list);
        System.out.println(newList);
    }
    static <T> List<T> doSomething(Function<T, T> f, List<T> list) {
        List<T> newList = new ArrayList<>(list.size());

        list.forEach(t -> newList.add(f.apply(t)));

        return newList;
    }
    static <T> void printEvenNum(Predicate<T> p, Consumer<T> c, List<T> list) {
        System.out.print("[");
        list.stream().filter(p).forEach(c);
        System.out.println("]");
    }
    static <T> void makeRandomList(Supplier<T> s, List<T> list) {
        for (int i = 0; i < 10; i++) {
            list.add(s.get());
        }
    }
}
```

### Predicate 결합

* and(), or(), negate() 로 두 Predicate 를 하나로 결합(default 메소드)
* 등가 비교를 위한 Predicate 작성에는 isEqual() 사용(static 메소드)
```
public class PredicateTest {
    public static void main(String[] args) {
        Function<String, Integer> f = s -> Integer.parseInt(s, 16); // 16진수 문자열을 10진수로 변환
        Function<Integer, String> g = Integer::toBinaryString;
        Function<String, String> h = f.andThen(g); // f 와 g 를 연결, 먼저 적용한 함수 이후 다음 함수를 결과에 적용하는 함수를 반환. 두 함수 중 하나를 평가할 때 예외가 발생하면 구성된 함수의 호출자에게 전달됩니다.
        Function<Integer, Integer> h2 = f.compose(g); // f 와 g 를 연결, 뒤에 함수 먼저 적용
        System.out.println(h.apply("FF")); // FF -> 255 -> 11111111
        System.out.println(h2.apply(2)); // 2 -> 10 -> 2

        Function<String, String> f2 = x -> x; // identity function
        System.out.println(f2.apply("AAA")); // AAA

        Predicate<Integer> p = i -> i < 100;
        Predicate<Integer> q = i -> i < 200;
        Predicate<Integer> r = i -> i % 2 == 0;
        Predicate<Integer> notP = p.negate(); // i >= 100

        Predicate<Integer> all = notP.and(q.or(r)); // i >= 100 && (i < 200 || i % 2 == 0)
        System.out.println(all.test(150)); // true

        String str = "abc";
        String str2 = "abc";

        System.out.println(Predicate.isEqual(str).test(str2)); // true

    }
}
```

### 컬렉션 프레임 워크와 함수형 인터페이스

* JDK 1.8 부터 컬렉션 프레임워크에 함수형 인터페이스를 사용할 수 있는 메소드가 추가되었다.
* Collection : boolean removeIf(Predicate<E> filter) : 조건에 맞는 요소 삭제
* List : void replaceAll(UnaryOperator<E> operator) : 모든 요소를 변환
* Iterable : void forEach(Consumer<T> action) : 모든 요소에 작업(action) 수행
* Map : V compute(K key, BiFunction<K, V, V> f) : key 값에 작업 f 를 수행
* Map : V computeIfAbsent(K key, Function<K, V> f) : key 가 존재하지 않으면 작업 f 를 수행 후 추가
* Map : V computeIfPresent(K key, BiFunction<K, V, V> f) : key 가 존재하면 작업 f 를 수행
* Map : V merge(K key, V value, BiFunction<V, V, V> f) : 모든 요소에 병합작업 f 를 수행
* Map : void forEach(BiConsumer<K, V> action) : 모든 요소에 작업(action) 수행
* Map : void replaceAll(BiFunction<K, V, V> f) : 모든 요소에 치환작업 f 를 수행
```
public class CollectionFunctional {
    public static void main(String[] args) {
        ArrayList<Integer> list = new ArrayList<>();
        for (var i = 0; i < 10; i++) {
            list.add(i);
        }

        list.forEach(System.out::println);
        System.out.println();

        list.removeIf(x -> x % 2 == 0 || x % 3 == 0);
        System.out.println(list);

        list.replaceAll(x -> x * 10);
        System.out.println(list);

        Map<String, String> map = new HashMap<>();
        map.put("1", "1");
        map.put("2", "2");
        map.put("3", "3");
        map.put("4", "4");

        map.forEach((k, v) -> System.out.println(k + " : " + v));
        System.out.println();
    }
}
```
