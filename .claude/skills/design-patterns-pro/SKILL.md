---
name: design-patterns-pro
description: Expert in software design patterns and architectural solutions. Use when refactoring code, improving architecture, or implementing proven design solutions.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Design Patterns Expert

## Pattern Categories

### 1. **Creational Patterns** (Object Creation)
- **Singleton** - Ensure single instance
- **Factory Method** - Create objects without specifying exact class
- **Abstract Factory** - Families of related objects
- **Builder** - Construct complex objects step-by-step
- **Prototype** - Clone existing objects

### 2. **Structural Patterns** (Object Composition)
- **Adapter** - Make incompatible interfaces work together
- **Decorator** - Add behavior to objects dynamically
- **Proxy** - Control access to objects
- **Facade** - Simplified interface to complex subsystem
- **Composite** - Tree structures of objects
- **Bridge** - Separate abstraction from implementation
- **Flyweight** - Share common state between objects

### 3. **Behavioral Patterns** (Object Interaction)
- **Strategy** - Encapsulate interchangeable algorithms
- **Observer** - Subscribe to events/changes
- **Command** - Encapsulate requests as objects
- **State** - Change behavior based on internal state
- **Chain of Responsibility** - Pass requests along a chain
- **Template Method** - Define algorithm skeleton
- **Iterator** - Sequential access to collections
- **Mediator** - Centralize complex communications
- **Memento** - Capture and restore object state
- **Visitor** - Add operations to object structures

## Analysis Checklist

1. **Identify Code Smells**
    - Long parameter lists � Builder pattern
    - Complex conditionals � Strategy or State pattern
    - Tight coupling � Dependency Injection, Adapter
    - Duplicate object creation � Factory pattern
    - Global state � Singleton or Context pattern

2. **Architecture Assessment**
    - Separation of concerns
    - SOLID principles adherence
    - Dependency direction (depend on abstractions)
    - Open/Closed principle violations

3. **Refactoring Opportunities**
    - Replace conditionals with polymorphism
    - Extract interfaces for testability
    - Introduce parameter objects
    - Encapsulate collections

## Instructions

1. **Analyze the codebase**
    - Use Glob to find relevant files (*.ts, *.tsx, *.js, *.jsx)
    - Use Grep to search for anti-patterns and code smells
    - Read files to understand current architecture

2. **Identify applicable patterns**
    - Look for repetitive object creation � Factory/Builder
    - Find complex conditionals � Strategy/State
    - Spot tight coupling � Adapter/Facade
    - Detect scattered event handling � Observer
    - Notice command-like structures � Command pattern

3. **Provide solutions**
    - Show before/after code examples
    - Explain why the pattern fits
    - Demonstrate TypeScript/JavaScript implementation
    - Include test examples when applicable

4. **Best practices**
    - Don't over-engineer (YAGNI principle)
    - Prefer composition over inheritance
    - Keep patterns simple and readable
    - Document pattern usage with comments

## Common Pattern Examples

### Strategy Pattern
```typescript
// Encapsulate interchangeable algorithms
interface PaymentStrategy {
  pay(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
  pay(amount: number) { /* ... */ }
}

class PayPalPayment implements PaymentStrategy {
  pay(amount: number) { /* ... */ }
}

class Checkout {
  constructor(private strategy: PaymentStrategy) {}

  processPayment(amount: number) {
    this.strategy.pay(amount);
  }
}
```

### Builder Pattern
```typescript
// Construct complex objects step-by-step
class UserBuilder {
  private user: Partial<User> = {};

  setName(name: string) {
    this.user.name = name;
    return this;
  }

  setEmail(email: string) {
    this.user.email = email;
    return this;
  }

  setAge(age: number) {
    this.user.age = age;
    return this;
  }

  build(): User {
    if (!this.user.name || !this.user.email) {
      throw new Error('Name and email are required');
    }
    return this.user as User;
  }
}

// Usage
const user = new UserBuilder()
  .setName('John')
  .setEmail('john@example.com')
  .setAge(30)
  .build();
```

### Factory Pattern
```typescript
// Create objects without specifying exact class
interface Animal {
  speak(): string;
}

class Dog implements Animal {
  speak() { return 'Woof!'; }
}

class Cat implements Animal {
  speak() { return 'Meow!'; }
}

class AnimalFactory {
  static create(type: 'dog' | 'cat'): Animal {
    switch (type) {
      case 'dog': return new Dog();
      case 'cat': return new Cat();
      default: throw new Error('Unknown animal type');
    }
  }
}

// Usage
const animal = AnimalFactory.create('dog');
```

### Observer Pattern
```typescript
// Subscribe to events/changes
interface Observer {
  update(data: any): void;
}

class Subject {
  private observers: Observer[] = [];

  attach(observer: Observer) {
    this.observers.push(observer);
  }

  detach(observer: Observer) {
    const index = this.observers.indexOf(observer);
    this.observers.splice(index, 1);
  }

  notify(data: any) {
    this.observers.forEach(o => o.update(data));
  }
}

// Modern alternative: Event Emitter
class EventEmitter {
  private events = new Map<string, Function[]>();

  on(event: string, callback: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  emit(event: string, data: any) {
    this.events.get(event)?.forEach(cb => cb(data));
  }
}
```

### Decorator Pattern
```typescript
// Add behavior to objects dynamically
interface Coffee {
  cost(): number;
  description(): string;
}

class SimpleCoffee implements Coffee {
  cost() { return 5; }
  description() { return 'Simple coffee'; }
}

class MilkDecorator implements Coffee {
  constructor(private coffee: Coffee) {}

  cost() { return this.coffee.cost() + 2; }
  description() { return this.coffee.description() + ', milk'; }
}

class SugarDecorator implements Coffee {
  constructor(private coffee: Coffee) {}

  cost() { return this.coffee.cost() + 1; }
  description() { return this.coffee.description() + ', sugar'; }
}

// Usage
let coffee: Coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
console.log(coffee.description()); // "Simple coffee, milk, sugar"
console.log(coffee.cost()); // 8
```

### Adapter Pattern
```typescript
// Make incompatible interfaces work together
interface NewLogger {
  logMessage(message: string): void;
}

class OldLogger {
  log(msg: string, level: string) {
    console.log(`[${level}] ${msg}`);
  }
}

class LoggerAdapter implements NewLogger {
  constructor(private oldLogger: OldLogger) {}

  logMessage(message: string) {
    this.oldLogger.log(message, 'INFO');
  }
}

// Usage
const oldLogger = new OldLogger();
const logger: NewLogger = new LoggerAdapter(oldLogger);
logger.logMessage('Hello'); // Works with new interface
```

## React-Specific Patterns

### Compound Components
```typescript
// Context-based component composition
const TabsContext = React.createContext(null);

function Tabs({ children }) {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ index, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  return (
    <button onClick={() => setActiveTab(index)}>
      {children}
    </button>
  );
};

Tabs.Panel = function TabPanel({ index, children }) {
  const { activeTab } = useContext(TabsContext);
  return activeTab === index ? <div>{children}</div> : null;
};
```

### Render Props
```typescript
// Share code through render prop
function DataFetcher({ url, render }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(url).then(r => r.json()).then(setData);
  }, [url]);

  return render(data);
}

// Usage
<DataFetcher
  url="/api/users"
  render={data => data ? <UserList users={data} /> : <Loading />}
/>
```

### Higher-Order Components (HOC)
```typescript
// Enhance components with additional functionality
function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return <Redirect to="/login" />;
    }

    return <Component {...props} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

## Anti-Patterns to Avoid

- **God Object** - Classes that do too much
- **Spaghetti Code** - Tangled control flow
- **Lava Flow** - Dead code that's never removed
- **Golden Hammer** - Using same pattern for everything
- **Premature Optimization** - Applying patterns before needed
- **Tight Coupling** - Classes that depend on concrete implementations

## SOLID Principles

- **S**ingle Responsibility - One reason to change
- **O**pen/Closed - Open for extension, closed for modification
- **L**iskov Substitution - Subtypes must be substitutable
- **I**nterface Segregation - Many specific interfaces over one general
- **D**ependency Inversion - Depend on abstractions, not concretions

## Resources

When analyzing code:
1. Identify the problem first (code smell, coupling, complexity)
2. Choose the simplest pattern that solves it
3. Verify it improves testability and maintainability
4. Document the pattern choice for future developers
