import { registerDecorator, ValidationOptions, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export function NotIn(property: string, validationOptions?: ValidationOptions) { // 1
    return (object: Object, propertyName: string) => { // 2
        registerDecorator({ // 3
            name: 'NotIn', // 4
            target: object.constructor, // 5
            propertyName,
            options: validationOptions, // 6
            constraints: [property], // 7
            validator: { // 8
                validate(value: any, args: ValidationArguments) {
                    const [relatedPropertyName] = args.constraints;
                    const relatedValue = (args.object as any)[relatedPropertyName];
                    return typeof value === 'string' && typeof relatedValue === 'string' &&
                        !relatedValue.includes(value);
                }
            },
        });
    };
}