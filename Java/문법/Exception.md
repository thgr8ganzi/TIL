## EXCEPTION

* 프로그램 실행 중에 발생하는 예기치 못한 에러
* 예외가 발생하면 프로그램이 강제 종료되기 때문에 예외 처리가 필요
* 예외 처리를 통해 프로그램의 비정상 종료를 막고, 정상적인 실행을 유지할 수 있음

### 자바에서 예외처리

```
public class ExceptionTest {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int c = a / b;
        } catch (ArithmeticException e) {
            System.out.println("ArithmeticException");
        } catch (Exception e) {
            System.out.println("Exception");
        } finally {
            System.out.println("Finally");
        }
    }
}
```
* try
  * 예외가 발생할 수 있는 코드를 작성
* catch
  * 예외가 발생했을 때 처리할 코드를 작성
  * catch 블록은 여러 개 작성 가능하며, 발생한 예외와 일치하는 catch 블록이 실행됨
  * catch 블록은 위에서 아래로 순차적으로 실행되므로, 상위 클래스의 catch 블록이 하위 클래스의 catch 블록보다 아래에 위치해야 함
* finally
  * 예외 발생 여부와 상관없이 항상 실행되는 코드를 작성
* throws
  * 예외를 호출한 메소드로 던지는 코드를 작성
  * 메소드 선언부에 throws 키워드를 사용하여 예외를 던질 수 있음
  * 호출한 메소드에서 예외를 처리하도록 함
  * throws 키워드를 사용하면 예외를 처리하지 않아도 되지만, 예외가 발생한 경우 프로그램이 강제 종료됨

### Error VS Checked Exception vs Unchecked Exception

* Error
  * 시스템 레벨에서 발생하는 예외
  * 프로그래머가 처리할 수 없는 예외
  * OutOfMemoryError, StackOverflowError 등
* Checked Exception
  * 컴파일러가 예외 처리를 강제하는 예외
  * 예외 처리를 하지 않으면 컴파일 에러 발생
  * 예외처리를 컴파일러가 체크함
* Unchecked Exception
  * 컴파일러가 예외 처리를 강제하지 않는 예외
  * RuntimeException 클래스를 상속받은 예외
  * 예외처리를 컴파일러가 체크하지 않음

### 자바 예외 클래스 계층 구조

```
public class Throwable implements Serializable {
...
}

public class Error extends Throwable {
...
}

public class Exception extends Throwable {
...
}

public class RuntimeException extends Exception {
...
}
```

### 롤백

* <a href="https://www.youtube.com/watch?v=_WkMhytqoCc">참고</a>