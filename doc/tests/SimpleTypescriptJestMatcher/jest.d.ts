declare global {
    namespace jest {
        interface Matchers<R> {
            toBeWithinOneMinuteOf(expected: Date): R
        }
    }
}

declare global {
    namespace Expect {
        interface Matchers<R> {
            toBeWithinOneMinuteOfTwo(expected: Date): R
        }
    }
}

export {};
