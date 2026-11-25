export class AddOrderLineCustomizationFields1795620044499 {
   public async up(queryRunner: { query: (sql: string, params?: any[]) => Promise<any> }): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "customFieldsCustomizationid" character varying(255)`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD COLUMN IF NOT EXISTS "customFieldsCustomizationdata" text`, undefined);
   }

   public async down(queryRunner: { query: (sql: string, params?: any[]) => Promise<any> }): Promise<any> {
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN IF EXISTS "customFieldsCustomizationdata"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN IF EXISTS "customFieldsCustomizationid"`, undefined);
   }
}
