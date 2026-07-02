export type DemoNavigator = {
    id: string;
    email: string;
    password: string;
    fullName: string;
};

export const DEMO_NAVIGATORS: DemoNavigator[] = [
    {
        id: "nav-1",
        email: "navigator@crainiometrix.local",
        password: "navigator-demo",
        fullName: "Alex Navigator",
    },
];

export const DEMO_CREDENTIALS_HINT = {
    email: DEMO_NAVIGATORS[0].email,
    password: DEMO_NAVIGATORS[0].password,
};

export function findNavigator(email: string, password: string): DemoNavigator | undefined {
    return DEMO_NAVIGATORS.find((navigator) => navigator.email === email && navigator.password === password);
}

export function getNavigatorById(id: string): DemoNavigator | undefined {
    return DEMO_NAVIGATORS.find((navigator) => navigator.id === id);
}

export function isValidNavigatorId(id: string): boolean {
    return DEMO_NAVIGATORS.some((navigator) => navigator.id === id);
}
