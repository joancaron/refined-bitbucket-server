class Issue {
  public id: string;
  public key: string;
  public name: string;
  public applicationLinkId: string;
  public transitions: Transition[];
  public canTransition: boolean;
  public properties: Properties;
  public fields: Fields;
}
