export type TypeFactory<type> = (metadata: TypeMetadata) => type;

export type TypeMetadata = {
  name: string;
  type: string;
};
