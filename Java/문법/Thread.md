## THREAD

* 프로세스 : 실행중인 프로그램, 자원과 쓰레드로 구성
* 쓰레드 : 프로세스 내에서 실제 작업을 수행, 모든 프로세스는 최소한 하나의 쓰레드를 가지고 있다.
* 하나의 새로운 프로세스를 생성하는것보다 하나의 새로운 쓰레드를 생성하는게 효율적
* context switching : CPU 가 한 쓰레드에서 다른 쓰레드로 전환하는 과정
* 장점
  * 시스템 자원을 보다 효율적으로 사용
  * 사용자에 대한 응답성 향상
  * 작업이 분리되어 코드 간결
* 단점
  * 동기화 주의
  * 교착상태 주의

### 구현 방법

* Thread 클래스 상속
```
public class MyThread extends Thread{
    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
//            현재 실행중인 자신 쓰레드 반환
            System.out.println(this.getName() + " = " + i + "번째");
        }
    }
}
```
* Runnable 인터페이스 구현
```
public class MyThread2 implements Runnable{
    @Override
    public void run() {
        for (int i = 0; i < 10; i++) {
//            현재 실행중인 쓰레드 반환
            System.out.println(Thread.currentThread().getName() + " = " + i + "번째");
        }
    }
}
```

### 실행

* 쓰레드의 실행 순서는 OS 스케줄러가 결정
* start() 메소드를 호출하면 새로운 쓰레드가 생성되고 run() 메소드가 호출(각각 Call Stack 에 쌓임)
```
@SpringBootTest
class MyThreadTest {
    @Test
    @DisplayName("Thread Test")
    public void threadTest() throws Exception{
//        Thread 상속 실행방법
        MyThread myThread1 = new MyThread();
//        쓰레드 시작
//        쓰레
        myThread1.start();

//        Runnable 구현 실행방법
        Thread thread2 = new Thread(new MyThread2());
        thread2.start();
    }
}
```

### Main Thread

* main() 메소드를 실행하는 쓰레드
* 쓰레드는 사용자 쓰레드, 데몬 쓰레드가 있다.
* 프로그램은 사용자 쓰레드가 하나도 없을때 종료 된다.
```
public class ThreadTest {
    static long startTime = 0;
    public static void main(String[] args) throws InterruptedException {
        MyThread myThread1 = new MyThread();
        Thread myThread2 = new Thread(new MyThread2());
        myThread1.start();
        myThread2.start();
        startTime = System.currentTimeMillis();

//        main 쓰레드가 myThread1, myThread2가 종료될때까지 대기
        myThread1.join();
        myThread2.join();

        System.out.println("소요시간 : " + (System.currentTimeMillis() - startTime));
    }
}
```

### 쓰레드 우선순위, 쓰레드 그룹

#### 우선순위

* 직업의 중요도에 따라 쓰레드의 우선순위를 다르게 하여 특정 쓰레드가 더 많은 작업시간을 갖게 할수 있다.
* 우선순위가 높은 쓰레드가 더 많은 시간을 할당 받는다.
* 보통의 JVM 의 우선순위는 1~10 이고 기본 우선순위는 5이다.
* Windows 의 경우 32 단계이다.
* 우선순위를 할당한다 해서 보장하진 않는다(OS 종속)
```
public class ThreadTest2 {
    public static void main(String[] args) {
        MyThread myThread1 = new MyThread();
        Thread myThread2 = new Thread(new MyThread2());

        myThread2.setPriority(7);
        System.out.println("myThread1.getPriority() = " + myThread1.getPriority());
        System.out.println("myThread2.getPriority() = " + myThread2.getPriority());
        myThread1.start();
        myThread2.start();
    }
}
```

#### 그룹

* 서로 관련된 쓰레드를 그룹으로 묶어서 다루기 위함
* 모든 쓰레드는 반드시 하나의 쓰레드 그룹에 포함
* 쓰레드 그룹을 지정하지 안고 생성한 쓰레드는 main 쓰레드 그룹에 속함
* 자신을 생성한 쓰레드(부모)의 그룹과 우선순위 상속받음

### 데몬 쓰레드(Daemon Thread)

* 일반쓰레드의 작업을 돕는 보조적인 역활을 수행
* 일반 쓰레드가 모두 종료되면 자동적으로 종료
* 가비지 컬렉터, 자동저장, 화면 자동갱신 등에 사용
* 무한 루프와 조건문을 이용해서 실행후 대기하다가 특정 조건이 만족되면 작업을 수행하고 다시 대기하도록 작성
```
public class DaemonThreadTest implements Runnable{
    static boolean autoSave = false;
    public static void main(String[] args) throws InterruptedException {
        Thread thread = new Thread(new DaemonThreadTest());
//        데몬쓰레드로 설정, start() 호출 전에 설정해야함
        thread.setDaemon(true);
        thread.start();

        for (int i = 0; i < 10; i++) {
            Thread.sleep(3000);
            System.out.println(i);
            autoSave = i == 5;
        }
        System.out.println("프로그램 종료");
    }

    @SneakyThrows
    @Override
    public void run() {
        while (true) {
            Thread.sleep(3000);
            if (autoSave) {
                System.out.println("자동저장");
            }
        }
    }
}
```

### 쓰레드 상태

* NEW : 쓰레드가 생성되고 아직 start() 가 호출되지 않은 상태
* RUNNABLE : 실행중 또는 실행 가능한 상태
* BLOCKED : 동기화 블럭에 의해서 일시정지된 상태(lock 이 풀릴때까지 기다리는 상태)
* WAITING : 쓰레드의 작업이 종료되지 않아 다른 쓰레드가 통지할때까지 기다리는 상태
* TIMED_WAITING : 일시정지 시간이 지정된 상태
* TERMINATED : 쓰레드의 실행이 종료된 상태

### 쓰레드 실행제어

* join() : 다른 쓰레드가 종료될때까지 기다림
* sleep() : 현재 쓰레드를 일정시간동안 멈추게 함
* interrupt() : 쓰레드를 깨움, interrupted Exception 발생시켜 일시정지 상태를 벗어남
* suspend() : 쓰레드 일시정지
* resume() : suspend() 로 일시정지된 쓰레드를 다시 실행
* stop() : 쓰레드 강제 종료(사용하지 않는것이 좋음)
* yield() : 다른 쓰레드에게 실행 양보

### 쓰레드 동기화

* 멀티쓰레드 프로세스에서 다른 쓰레드의 작업에 영향을 미칠수 있음
* 진행중인 작업을 다른 쓰레드에게 간섭받지 않게 동기화 필요
* 동기화 하려면 간섭하지 않아야 하는 문장들을 임계영역으로 설정
* 임계영역은 락을 얻은 단 하나의 쓰레드만 출입가능(객체 1개에 락1개)
* synchronized 키워드를 사용하여 동기화
* 임계영역은 많을수록 성능이 떨어지기 때문에 최소화 해야함
```
@Getter
public class SynchronizedAccount {
    private int balance = 1000;

    public synchronized void withdraw(int money) throws InterruptedException {
        if (balance >= money) {
            Thread.sleep(1000);
            balance -= money;
        }
    }
}
public class SynchronizedTest implements Runnable {
    public static void main(String[] args) {
        SynchronizedTest synchronizedTest = new SynchronizedTest();
        Thread thread1 = new Thread(synchronizedTest);
        Thread thread2 = new Thread(synchronizedTest);
        thread1.start();
        thread2.start();
    }
    @SneakyThrows
    @Override
    public void run() {
        SynchronizedAccount synchronizedAccount = new SynchronizedAccount();

        while (synchronizedAccount.getBalance() > 0) {
            int money = (int) (Math.random() * 3 + 1) * 100;
            synchronizedAccount.withdraw(money);
            System.out.println("balance : " + synchronizedAccount.getBalance());
        }
    }
}
```

### wait, notify

* 동기화 효율을 높이기 위해 wait, notify 사용
* Object 클래스에 정의되어 있으며 동기화 블록내에서만 사용
* wait() : 객체의 lock 을 풀고 쓰레드를 해당 객체의 waiting pool 에 넣음
* notify() : waiting pool 에 있는 쓰레드 하나를 깨움
* notifyAll() : waiting pool 에 있는 모든 쓰레드를 깨움
```
package com.example.junittest.Thread;

import lombok.SneakyThrows;

import java.util.ArrayList;

class Customer implements Runnable{
    private Table table;
    private String food;

    public Customer(Table table, String food) {
        this.table = table;
        this.food = food;
    }
    @SneakyThrows
    @Override
    public void run() {
        while (true) {
            Thread.sleep(100);
            String name = Thread.currentThread().getName();

            table.remove(food);
            System.out.println(name + " ate a " + food);
        }
    }
}
class Cook implements Runnable{
    private Table table;

    public Cook(Table table) {
        this.table = table;
    }

    @SneakyThrows
    @Override
    public void run() {
        while (true) {
            int idx = (int) (Math.random() * table.dishNum());
            table.add(table.dishNames[idx]);
            Thread.sleep(10);
        }
    }
}
class Table {
    String[] dishNames = {"donut", "burger"};
    final int MAX_FOOD = 6;
    private ArrayList<String> dishes = new ArrayList<>();

    public synchronized void add(String dish) throws InterruptedException {
        while (dishes.size() >= MAX_FOOD) {
            String name = Thread.currentThread().getName();
            System.out.println(name + " is waiting.");
            wait();
            Thread.sleep(500);
        }
        dishes.add(dish);
        notify();
        System.out.println("Dishes: " + dishes.toString());
    }

    public void remove(String dishName) throws InterruptedException {
        synchronized (this) {
            String name = Thread.currentThread().getName();

            while (dishes.isEmpty()) {
                System.out.println(name + " is waiting.");
                wait();
                Thread.sleep(500);
            }

            while (true) {
                for (int i = 0; i < dishes.size(); i++) {
                    if (dishName.equals(dishes.get(i))) {
                        dishes.remove(i);
                        notify();
                        return;
                    }
                }
                System.out.println(name + " is waiting.");
                wait();
                Thread.sleep(500);
            }
        }
    }
    public int dishNum() { return dishNames.length; }
}
class ThreadWaitNotify {
    public static void main(String[] args) throws Exception {
        Table table = new Table();
        new Thread(new Cook(table), "COOK").start();
        new Thread(new Customer(table, "donut"), "CUST1").start();
        new Thread(new Customer(table, "burger"), "CUST2").start();
        Thread.sleep(2000);
        System.exit(0);
    }
}
```