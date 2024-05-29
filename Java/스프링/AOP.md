## AOP

* AOP(Aspect Oriented Programming)은 관점 지향 프로그래밍이라고 한다.
* 횡단 관심사(cross-cutting concern)의 분리를 허용함으로써 모듈성을 증가시키는것이 목적인 프로그래밍 패러다임
* 여러개의 객체에 공통으로 적용할수 있는 기능을 분리해서 개발자는 반복작업을 줄이고 핵심기능 개발에만 집중할수 있다.

### 코드 중복

```
public interface Calc {
    long factorial(long num);
}
public class BasicCalc implements Calc{
    @Override
    public long factorial(long num) {
        long result = 1;
        for (long i = 1; i <= num; i++) {
            result *= i;
        }
        return result;
    }
}
public class FactoCalc implements Calc{
    @Override
    public long factorial(long num) {
        if (num == 0) {
            return 1;
        }
        return num * factorial(num - 1);
    }
}
public class CalcMain {
    public static void main(String[] args) {
        Calc basic = new BasicCalc();
        Calc facto = new FactoCalc();

        long basicStart = System.nanoTime();
        basic.factorial(100);
        long basicEnd = System.nanoTime();
        System.out.println("BasicCalc.factorial(100) : " + (basicEnd - basicStart) + "ms");

        long factoStart = System.nanoTime();
        facto.factorial(100);
        long factoEnd = System.nanoTime();
        System.out.println("FactoCalc.factorial(100) : " + (factoEnd - factoStart) + "ms");
    }
}
```

### 관점 지향으로 해결

* 프록시를 사용해 해결할수 있다.
* 프록시란 자신이 클라이언트가 사용하려는 실제 대상인것처럼 위장해서 클라이언트의 요청을 받아주는것
* 사용목적에 따라 클라이언트가 타깃에 접근하는 방법제어(프록시 패턴), 타깃에 부가적인 기능을 부여해주기 위해(데코레이터 패턴)로 사용된다.
```
public class ExecutionTimeCalc implements Calc {
    private final Calc delegate;

    public ExecutionTimeCalc(Calc delegate) {
        this.delegate = delegate;
    }

    @Override
    public long factorial(final long num) {
        long start = System.nanoTime();
        long result = delegate.factorial(num);
        long end = System.nanoTime();
        System.out.println(delegate.getClass().getSimpleName() + ".factorial(" + num + ") : " + (end - start) + "ns");
        return result;
    }
}
Calc basicExecutionTimeCalc = new ExecutionTimeCalc(new BasicCalc());
System.out.println(basicExecutionTimeCalc.factorial(100));

Calc factoExecutionTimeCalc = new ExecutionTimeCalc(new FactoCalc());
System.out.println(factoExecutionTimeCalc.factorial(100));
```
* 핵심기능과 부가기능을 나눠 부가기능을 횡단관심사로 나누어 코드를 줄이고 가독성을 높일수 있다.

### AOP 용어

* Target Object : 부가기능을 부여할 대상(스프링 AOP 는 런타임 프록시로 구현되므로 타깃은 항상 프록시)
* Aspect : AOP 기본 모듈, 그 자체로 애플리케이션의 핵심 기능을 담고있진 않지만 애플리케이션을 구성하는 중요한 요소, 부가될 기능을 정의한 Advice 와 어드바이스를 어디에 적용할지 결정하는 PointCut 을 함께 가짐(트랜잭션 관리가 가장좋은 예시)
* Advice : 부가 기능을 담은 모듈, 타깃이 필요없는 순수한 부가 기능, Aspect 가 언제 무엇을 할지 정의(Around, Before, AfterReturning, AfterThrowing, After 등 다양한 어드바이스 존재)
* JoinPoint : Advice 가 적용될 수 있는 위치(메소드 호출, 필드값 변경, 생성자 호출 등)
* PointCut : Advice 가 적용될 JoinPoint 를 선별하는 기능(메소드를 선정하는 기능)
* 인터페이스 기능 = JoinPoint
* 실행 시간 측정 = Advice
* Fact 메소드에만 적용할것이다 = PointCut
* 실행시간 측정 + Fact 메소드에만 적용 = Aspect

### AOP 구현 방법

* 컴파일 시점에 코드에 공통 기능 삽입
* 클래스 로딩 시점에 바이트 코드에 공통 기능 삽입
* 런타임에 프록시를 이용해 공통 기능 삽입
  * 컴파일러나 클래스 로더 조작기를 설정하지 않아도 됨
  * 프록시는 메소드 오버라이딩 개념으로 동작하기 때문에 스프링 AOP 는 메소드 실행 지점에만 적용 가능
  * 스프링 컨테이너가 관리하는 빈에만 적용할수 있음

### 스프링에서 AOP 구현

* Ioc/DI 컨테이너
* Dynamic Proxy
* 데코레이터/프록시 패턴
* 자동 프록시 생성
* 빈 오브젝트 후처리 조작
```
implementation 'org.springframework.boot:spring-boot-starter-aop'

public interface Calc {
    long factorial(long num); // JoinPoint
    long factPlus(long num1, long num2); // JoinPoint
    long minus(long num1, long num2); // JoinPoint
}

@Component
public class BasicCalc implements Calc{
    @Override
    public long factorial(long num) {
        long result = 1;
        for (long i = 1; i <= num; i++) {
            result *= i;
        }
        return result;
    }

    @Override
    public long factPlus(long num1, long num2) {
        return num1 + num2;
    }

    @Override
    public long minus(long num1, long num2) {
        return num1 - num2;
    }
}

@Component
@Aspect
public class ExecutionTimeCalc {
    @Pointcut("execution(* fact*(..))") // 메소드 이름이 fact 로 시작하는 메소드
    private void publicTarget() {
    }
    @Around("publicTarget()") // Advice
    public Object measure(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        Object result = joinPoint.proceed(); // Target, fact 연산
        long end = System.nanoTime();
        Signature sig = joinPoint.getSignature();
        System.out.printf(
                "%s.%s(%s) 실행 시간 : %d\n",
                joinPoint.getTarget().getClass().getSimpleName(),
                sig.getName(),
                Arrays.toString(joinPoint.getArgs()),
                (end - start)
                );
        return result;
    }
}

@SpringBootTest
class CalcTest {
    @Qualifier("basicCalc")
    @Autowired
    private Calc calc;

    @Test
    public void test1() throws Exception{
        long result = calc.factorial(5);
        System.out.println("result = " + result);

        long result2 = calc.factPlus(5, 3);
        System.out.println("result2 = " + result2);

        long result3 = calc.minus(5, 3);
        System.out.println("result3 = " + result3);
    }
}
```
* 주요 기능(Target Object)중 어느곳(Join Point)에 부가기능을(Advice) 언제(Point Cut) (Aspect) 적용할지
