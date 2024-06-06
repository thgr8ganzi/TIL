
## Reflection

* jvm 은 클래스 정보를 클래스 로더를 통해 읽어와서 jvm 메모리에 올린다.
* 그렇게 저장된 정보가 거울에 투영된 모습과 닮아있어 리플렉션 이라고 한다.
* 리플렉션을 사용하면 생성자, 메소드, 필드등 클래스에 대한 정보를 자세히 알수있다.
* 어노테이션은 리플렉션을 사용한 예시이다.
* 객체를 통해 클래스의 정보를 분석해 내는 프로그램 기법
* 리플렉션을 사용하면 접근 제어자와 무관하게 클래스의 필드나 메소드도 가져와서 호출할 수 있다.

### 단점

* 보안취약, 복잡도증가, 성능저하, 최적화 방해, 타입 안정성, 호환성

### 클래스, 생성자, 메소드 리플렉션

```
public class MyClass {
    private final String name;
    private final int age;

    public MyClass(String name, int age) {
        this.name = name;
        this.age = age;
    }

    private void print() {
        System.out.println("Name: " + name + ", Age: " + age);
    }
}

public class ClassTest {
    public static void main(String[] args) throws ClassNotFoundException, NoSuchFieldException, IllegalAccessException, NoSuchMethodException, InvocationTargetException, InstantiationException {
        final Class<MyClass> clazz1 = MyClass.class;
        final Class<?> clazz2 = Class.forName("clazz.MyClass");
        final MyClass obj = new MyClass("지수", 20);
        final Class<? extends MyClass> clazz3 = obj.getClass();

        final Field field = clazz1.getDeclaredField("name");
        field.setAccessible(true);
        final String name = (String) field.get(obj);
        System.out.println(name);

        final Constructor<MyClass> constructor = clazz1.getDeclaredConstructor(String.class, int.class);
        constructor.setAccessible(true);
        final MyClass myClass = constructor.newInstance("제니", 21);

        final Method declaredMethod = clazz1.getDeclaredMethod("print");
        declaredMethod.setAccessible(true);
        declaredMethod.invoke(myClass);

    }
}
```

### 전략패턴으로 리플렉션 활용

```
public interface MovingStrategy {
    void print();
}
public class DefaultMovingStrategy implements MovingStrategy{
    @Override
    public void print() {
        System.out.println("기본 전략");
    }
}
public class RandomMovingStrategy implements MovingStrategy {
    @Override
    public void print() {
        System.out.println("랜덤 전략");
    }
}
```
```
public class StrategyReflection1 {
    public static void main(String[] args) throws Exception{
        final String strategyName = "DefaultMovingStrategy";
        MovingStrategy movingStrategy = null;
        if ("DefaultMovingStrategy".equals(strategyName)) {
            movingStrategy = new DefaultMovingStrategy();
        }
        if ("RandomMovingStrategy".equals(strategyName)) {
            movingStrategy = new RandomMovingStrategy();
        }
        movingStrategy.print();
    }
}
public class StrategyReflection2 {
    public static void main(String[] args) throws Exception{
        String strategyClassName = "clazz.RandomMovingStrategy";

        final Class<?> clazz = Class.forName(strategyClassName);
        final Constructor<?> constructor = clazz.getDeclaredConstructor();
        final MovingStrategy movingStrategy = (MovingStrategy) constructor.newInstance();

        movingStrategy.print();
    }
}
```