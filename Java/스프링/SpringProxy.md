## SpringProxy

* 프록시는 대리자 또는 대리인이라는 뜻으로, 클라이언트가 서비스를 요청하면 서비스를 제공하는 객체가 아닌 프록시 객체가 요청을 받아서 처리하는 방식이다.
* 타깃과 같은 메소드를 구현하고 있다가 메소드가 호출되면 타깃 오브젝트로 위임해주는것, 지원한 요청에 부가기능 수행
* 스프링 AOP 는 프록시 기반이다.

### 프록시 문제점

* 매번 새로운 클래스 정의
* 타깃 인터페이스 구현, 위임 코드 작성 번거롭다
* 코드 중복

### JDK Dynamic Proxy

* 자바에서 제공하는 프록시 생성을 위한 인터페이스
* 프록시 팩토리에 의해 런타임시 다이나믹하게 만들어지는 오브젝트
* 프록시 팩토리에게 인터페이스 정보만 제공해주면 해당 인터페이스를 구현한 클래스 오브젝트를 자동으로 생성
* 인터페이스가 반드시 존재해야 한다.
* 부가기능 코드는 직접 작성한다.
* InvocationHandler 인터페이스를 구현하여 부가기능을 구현한다.
* Proxy.newProxyInstance() 메소드를 이용하여 프록시 객체를 생성한다.
* 프록시 객체는 타깃 객체를 참조하고 있어 타깃 객체의 메소드를 호출할 수 있다.
```
public interface DynamicProxyService {
    void doSomething();
}

public class DynamicProxyServiceImpl implements DynamicProxyService{
    @Override
    public void doSomething() {
        System.out.println("DynamicProxyServiceImpl doSomething");
    }
}

public class DynamicInvocationHandler implements InvocationHandler {
    private final Map<String, Method> methods = new HashMap<>();
    private final Object target;

    public DynamicInvocationHandler(Object target) {
        this.target = target;
        for (var method : target.getClass().getMethods()) {
            methods.put(method.getName(), method);
        }
    }

    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("DynamicInvocationHandler invoke");
        return methods.get(method.getName()).invoke(target, args);
    }
}

@SpringBootTest
class ProxyTest {
    @Test
    public void DynamicProxy() throws Exception{
        DynamicProxyService target = (DynamicProxyService) Proxy.newProxyInstance(
                DynamicProxyService.class.getClassLoader(),                  // 프록시 클래스가 정의된 클래스 로더
                new Class[]{DynamicProxyService.class},                      // 타깃의 인터페이스 리스트
                new DynamicInvocationHandler(new DynamicProxyServiceImpl())  // 타깃의 정보가 포함된 Handler
        );
        target.doSomething();
        System.out.println("DynamicProxyService: " + target.getClass());
    }
}
```

### CGLIB

* 프록시 팩토리에 의해 런타임시 다이나믹하게 만들어지는 오브젝트
* 클래스 상속을 이용하여 생성하기 때문에 인터페이스가 존재하지 않아도 가능
* 부가기능 코드는 직접 작성
* MethodInterceptor 인터페이스를 구현하여 부가기능을 구현
* Enhancer.create() 메소드를 이용하여 프록시 객체를 생성
```
public class GCLIBHelloService {
    public String hello(String name) {
        return "Hello " + name;
    }

    public String hey(String name) {
        return "Hey " + name;
    }

    public String others(String name) {
        return "others ~ " + name;
    }
}

public class GCLIBMethodInterceptor implements MethodInterceptor {
    private final Object target;

    public GCLIBMethodInterceptor(Object target) {
        this.target = target;
    }

    @Override
    public Object intercept(Object obj, Method method, Object[] args, MethodProxy proxy) throws Throwable {
        System.out.println("intercept start");
        if (method.getName().equals("hey")) {
            return "hey hey hey";
        }
        if (method.getName().equals("hello")) {
            return method.invoke(target, ((String) args[0]).toUpperCase());
        }
        System.out.println("intercept end");
        return method.invoke(target, ((String) args[0]).toLowerCase());
    }
}


@SpringBootTest
class ProxyTest {
    @Test
    public void GCLIBProxy() throws Exception{
        GCLIBHelloService proxy = (GCLIBHelloService) Enhancer.create(
                GCLIBHelloService.class,                                 // 타깃 클래스
                new GCLIBMethodInterceptor(new GCLIBHelloService())      // 타깃의 정보가 포함된 Interceptor
        );
        System.out.println(proxy.hello("World"));
        System.out.println(proxy.hey("World"));
        System.out.println(proxy.others("World"));
        System.out.println("GCLIBHelloService: " + proxy.getClass());
    }
}
```

### CGLIB vs JDK Dynamic Proxy

* 인터페이스가 존재하는 경우 JDK Dynamic Proxy 를 사용하고, 인터페이스가 없는 경우 CGLIB 를 사용한다.
* Spring 3.2 이후부터는 Enhancer 가 core 에 포함되어 있어 별도의 의존성이 필요없다.
* 대상 객체가 인터페이스를 구현하고 있다면, JDK Dynamic Proxy 를 사용하는 것이 좋다. 
* 이는 Java 의 내장 기능이므로 별도의 라이브러리 의존성 없이 사용할 수 있다.
* 대상 객체가 인터페이스를 구현하지 않았거나, 특정 클래스를 상속받아야 하는 경우에는 CGLIB 를 사용하는 것이 좋다
* 하지만 CGLIB 는 final 클래스나 final 메소드에는 사용할 수 없으므로 이 점을 주의해야 한다.