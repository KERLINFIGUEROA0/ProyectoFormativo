import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Produccion } from '../../producciones/entities/produccione.entity';


@Entity('ventas')
export class Venta {
@PrimaryGeneratedColumn({ name: 'Id_Venta' })
id: number;


@Column({ name: 'Fecha', type: 'timestamp', nullable: true })
fecha: Date;


@Column({ name: 'Precio_Unitario', type: 'int', nullable: true })
precioUnitario: number;


@Column({ name: 'Cantidad_Venta', type: 'int', nullable: true })
cantidadVenta: number;


@Column({ name: 'Valor_Total_Venta', type: 'int', nullable: true })
valorTotalVenta: number;


@ManyToOne(() => Produccion, (produccion) => produccion.ventas, { onDelete: 'CASCADE' })
  produccion: Produccion;
}